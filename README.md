# Extensão Chrome Workana

## Visão Geral

Esta extensão para Chrome foi projetada para ajudar os usuários a analisar conversas na plataforma Workana. Ela fornece insights sobre o status das conversas, categorizando-as como:
- **Respondidas pelo Cliente**: Conversas respondidas pelo cliente.
- **Lidas pelo Cliente**: Conversas lidas pelo cliente.
- **Não Lidas pelo Cliente**: Conversas não lidas pelo cliente.

A extensão interage com o site Workana para extrair e exibir dados relevantes diretamente na interface do popup.

## Funcionalidades

- **Análise de Conversas**: Analisa automaticamente as conversas no Workana e as categoriza com base em seu status.
- **Exibição na UI**: Exibe contagens e listas de conversas categorizadas no popup.
- **Dados Persistentes**: Salva os resultados da análise localmente usando a API de armazenamento do Chrome para referência futura.
- **Navegação**: Permite que os usuários naveguem para conversas específicas diretamente do popup.

## Instalação

1. Clone o repositório ou baixe o código fonte.
2. Abra o Chrome e navegue até `chrome://extensions`.
3. Ative o "Modo de desenvolvedor" no canto superior direito.
4. Clique em "Carregar sem compactação" e selecione a pasta da extensão.

## Uso

1. Abra o site Workana e navegue até sua caixa de entrada ou página de projeto.
2. Clique no ícone da extensão na barra de ferramentas do Chrome.
3. Clique no botão "Verificar Conversas" para analisar as conversas.
4. Veja os resultados categorizados no popup.

## Solução de Problemas

- Certifique-se de estar em uma página do Workana com conversas visíveis antes de usar a extensão.
- Se nenhum resultado for exibido, verifique os logs do console para erros (`Ctrl+Shift+J` no Chrome).

## Licença

Este projeto está licenciado sob a Licença MIT.
