/**
 * This function is injected into the active Workana tab to perform the checks.
 * It attempts to click each conversation, wait for content to load, and then analyze messages.
 * IMPORTANT: This function's success heavily depends on how Workana's website is structured.
 * If clicking a conversation causes a full page reload that destroys the script's context,
 * this loop might only process the first item or behave unpredictably.
 * It assumes SPA-like behavior or that the conversation list remains accessible.
 */
async function contentScriptLogic() {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const results = {
        respondidasPeloCliente: [],
        lidasPeloCliente: [],
        naoLidasPeloCliente: [],
        counts: { respondidas: 0, lidas: 0, naoLidas: 0 }
    };

    /**
     * Analyzes the last message of a conversation to categorize it.
     * @param {Element} lastMessage - The last message element.
     * @param {string} conversationTitle - The title of the conversation.
     * @param {string} conversationHref - The href of the conversation.
     */
    function analyzeLastMessage(lastMessage, conversationTitle, conversationHref) {
        const { classList } = lastMessage;
        let categorized = false;

        if (classList.contains('message-last') && classList.contains('other')) {
            results.respondidasPeloCliente.push({ title: conversationTitle, href: conversationHref });
            results.counts.respondidas++;
            categorized = true;
        } else if (classList.contains('message-last')) {
            if (lastMessage.querySelector('.wk2-icon-check-double-b')) {
                results.lidasPeloCliente.push({ title: conversationTitle, href: conversationHref });
                results.counts.lidas++;
                categorized = true;
            } else if (lastMessage.querySelector('.wk2-icon-check-b')) {
                results.naoLidasPeloCliente.push({ title: conversationTitle, href: conversationHref });
                results.counts.naoLidas++;
                categorized = true;
            }
        }

        if (!categorized) {
            console.log(`Workana Helper: Conversa "${conversationTitle}" - última mensagem não categorizada.`);
        }
    }

    /**
     * Processes a single conversation link: clicks it, waits, and analyzes messages.
     * @param {HTMLAnchorElement} linkElement - The conversation link element.
     * @param {number} index - The index of the link in the list.
     */
    async function processSingleConversationLink(linkElement, index) {
        const titleElement = linkElement.querySelector('p.ellipsis');
        const conversationTitle = titleElement ? titleElement.innerText : `Conversa ${index + 1} (título não encontrado)`;
        const conversationHref = linkElement.href;

        try {
            linkElement.click();
        } catch (e) {
            console.error(`Workana Helper: Erro ao clicar no link para "${conversationTitle}":`, e);
            return; // Skip this link if click fails
        }

        // Ensure the element is still in the DOM and clickable.
        if (!document.body.contains(linkElement)) {
            console.warn(`Workana Helper: Link para "${conversationTitle}" não está mais no documento. Pulando. Isso pode acontecer se a estrutura da página mudar significativamente após cliques.`);
            return; // Skip to the next link
        }

        await sleep(1000); // Wait for content to potentially load

        const messageItems = document.querySelectorAll('#container ul li.message-last');
        if (messageItems.length > 0) {
            const lastMessage = messageItems[messageItems.length - 1];
            analyzeLastMessage(lastMessage, conversationTitle, conversationHref);
        } else {
            console.warn(`Workana Helper: Nenhuma mensagem encontrada em #container para a conversa: "${conversationTitle}". Isso pode ser devido ao tempo de carregamento da página ou seletores incorretos após o clique.`);
        }
    }

    const conversationLinkElements = Array.from(document.querySelectorAll('.list-unstyled .user a'));

    if (conversationLinkElements.length === 0) {
        console.warn("Workana Helper: Nenhum link de conversa encontrado com o seletor '.list-unstyled .user a'. Verifique se o seletor está correto e se você está na página certa.");
        return results;
    }

    for (let i = 0; i < conversationLinkElements.length; i++) {
        const linkElement = conversationLinkElements[i];
        await processSingleConversationLink(linkElement, i);
        // CRITICAL NOTE: If linkElement.click() caused navigation, the script's context might be lost.
        // This loop's continuation implies dynamic content updates (SPA) or persistent conversation list.
    }
    return results;
}


document.addEventListener('DOMContentLoaded', () => {
    const verificarBtn = document.getElementById('verificarConversasBtn');
    const loadingDiv = document.getElementById('loadingDiv');

    const countRespondidasEl = document.getElementById('countRespondidas');
    const countLidasEl = document.getElementById('countLidas');
    const countNaoLidasEl = document.getElementById('countNaoLidas');

    const listRespondidasEl = document.getElementById('listRespondidas');
    const listLidasEl = document.getElementById('listLidas');
    // Assuming you might want a list for "Nao Lidas" as well in the future,
    // similar to how popup.html is structured for the other two.


    /**
     * Sets the loading state for the UI.
     * @param {boolean} isLoading - True to show loading, false to hide.
     */
    function setLoadingState(isLoading) {
        loadingDiv.style.display = isLoading ? 'block' : 'none';
        verificarBtn.disabled = isLoading;
    }

    /**
     * Clears previously displayed results from the UI.
     */
    function clearPreviousUIResults() {
        listRespondidasEl.innerHTML = '';
        listLidasEl.innerHTML = '';

        countRespondidasEl.textContent = '0';
        countLidasEl.textContent = '0';
        countNaoLidasEl.textContent = '0';
    }

    /**
     * Populates a <ul> element with list items.
     * @param {HTMLUListElement} ulElement - The <ul> element to populate.
     * @param {Array<{title: string, href: string}>} items - Array of items to display.
     * @param {number | null} tabId - The ID of the current tab for navigation, or null if navigation is not needed.
     * @param {string} emptyMessage - Message to display if items array is empty.
     */
    function populateList(ulElement, items, tabId, emptyMessage) {
        ulElement.innerHTML = ''; // Clear previous items
        if (!items || items.length === 0) {
            const li = document.createElement('li');
            li.textContent = emptyMessage;
            li.style.cursor = 'default';
            li.style.color = '#777';
            li.style.fontStyle = 'italic';
            li.classList.add('no-items');
            ulElement.appendChild(li);
            return;
        }
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.title;
            li.title = `Clique para ir para: ${item.title}`;
            li.dataset.href = item.href;

            li.addEventListener('click', () => {
                if (item.href && tabId !== null) {
                    chrome.tabs.update(tabId, { url: item.href });
                    window.close(); // Close the popup after clicking
                } else if (!item.href) {
                    console.warn("Workana Helper: Tentativa de navegar para um href indefinido.", item);
                }
            });
            ulElement.appendChild(li);
        });
    }

    /**
     * Updates the UI with the data received from the content script.
     * @param {object} data - The data object from contentScriptLogic.
     * @param {number} tabId - The ID of the current tab.
     */
    function updateUIAfterVerification(data, tabId) {
        countRespondidasEl.textContent = data.counts.respondidas;
        countLidasEl.textContent = data.counts.lidas;
        countNaoLidasEl.textContent = data.counts.naoLidas;

        populateList(listRespondidasEl, data.respondidasPeloCliente, tabId, "Nenhuma conversa respondida pelo cliente.");
        populateList(listLidasEl, data.lidasPeloCliente, tabId, "Nenhuma conversa lida pelo cliente.");
    }

    /**
     * Handles errors during the verification process.
     * @param {string} message - The primary error message for an alert.
     * @param {Error|object} [errorObject] - Optional error object for console logging.
     */
    function handleVerificationError(message, errorObject) {
        if (errorObject) {
            console.error("Workana Helper Error:", errorObject);
        }
        alert(message);
    }


    const loadSavedData = () => {
        chrome.storage.local.get(['workanaData'], (result) => {
            if (chrome.runtime.lastError) {
                console.error('Error loading saved data:', chrome.runtime.lastError);
                return;
            }
            if (result.workanaData) {
                const data = result.workanaData;
                countRespondidasEl.textContent = data.counts.respondidas;
                countLidasEl.textContent = data.counts.lidas;
                countNaoLidasEl.textContent = data.counts.naoLidas;

                // Pass null for tabId as we don't want to navigate from here, just display
                populateList(listRespondidasEl, data.respondidasPeloCliente, null, "Nenhuma conversa respondida pelo cliente.");
                populateList(listLidasEl, data.lidasPeloCliente, null, "Nenhuma conversa lida pelo cliente.");
            }
        });
    };

    loadSavedData();

    verificarBtn.addEventListener('click', async () => {
        setLoadingState(true);
        clearPreviousUIResults();

        let tab;
        try {
            [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        } catch (error) {
            handleVerificationError("Erro ao consultar abas. Verifique as permissões da extensão.", error);
            setLoadingState(false);
            return;
        }


        if (tab) {
            if (!tab.url || !tab.url.includes('workana.com')) {
                alert('Por favor, abra esta extensão em uma página do Workana (ex: sua caixa de entrada ou uma página de projeto).');
                setLoadingState(false);
                return;
            }

            try {
                const injectionResults = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: contentScriptLogic
                });

                if (injectionResults && injectionResults[0] && injectionResults[0].result) {
                    const data = injectionResults[0].result;

                    chrome.storage.local.set({ workanaData: data }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Error saving data:', chrome.runtime.lastError);
                        }
                    });
                    updateUIAfterVerification(data, tab.id);
                } else {
                    handleVerificationError("Erro ao processar conversas. Nenhum resultado do script de conteúdo ou formato de resultado inesperado. Verifique os consoles.", injectionResults);
                }
            } catch (error) {
                handleVerificationError(`Erro ao executar o script: ${error.message}. Verifique se você está na página correta do Workana com a lista de conversas visível. Consulte o console para mais detalhes.`, error);
            } finally {
                setLoadingState(false);
            }
        } else {
            alert("Nenhuma aba ativa encontrada.");
            setLoadingState(false);
        }
    });
});