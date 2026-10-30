# Como adicionar um artigo

Os artigos ficam nesta pasta, um arquivo de texto (`.md`) por artigo, em
`conteudo/artigos/`. As páginas do site são geradas a partir deles. Nunca edite
a pasta `artigos/` da raiz, porque ela é apagada e criada de novo a cada build.

1. **Copie o modelo.** Duplique `conteudo/artigos/_modelo.md` e renomeie a
   cópia. **O nome do arquivo vira o endereço do artigo**: `catarata-quando-operar.md`
   vira `/artigos/catarata-quando-operar/`. Use letras minúsculas, sem acento,
   com hífen no lugar do espaço.
2. **Preencha o topo** (entre as linhas `---`), uma informação por linha:
   - `titulo:` o título que aparece na página, na aba do navegador e no Google;
   - `resumo:` uma ou duas frases (até uns 155 caracteres), usadas na lista de
     artigos e no Google;
   - `data:` a data de publicação no formato ano-mês-dia, por exemplo `2026-10-15`;
   - `capa:` (opcional) o nome do arquivo da imagem, que deve ser colocado em
     `assets/artigos/`, por exemplo `capa-catarata.jpg`. O ideal é JPG,
     1200 × 675 px, até 250 KB;
   - `capa_descricao:` (se tiver capa) uma frase dizendo o que a imagem mostra;
   - `cirurgia:` (opcional) `catarata`, `lasik`, `prk`, `refrativa` ou `crosslinking`. Põe no fim
     do artigo um link para a animação daquela cirurgia;
   - `rascunho:` `sim` enquanto estiver em revisão (a página é gerada só para
     conferir e nunca vai para o ar) e `não` para publicar.
3. **Cole o texto** embaixo do segundo `---`, com uma linha em branco entre os
   parágrafos. Para subtítulo, comece a linha com `## `. Para lista, com `- `.
   Para negrito, use `**assim**`.
4. **Gere e confira:** `node .work/build-artigos.cjs` e abra
   `http://127.0.0.1:8766/artigos/` com o servidor de preview
   (`node .work/v2-server.cjs 8766`). O build avisa se faltar alguma
   informação ou se o texto tiver palavras que o CFM não permite (promessa de
   resultado, preço, depoimento).
5. **Publique** com os dois comandos de sempre (`node .work/build-dist.cjs` e o
   `netlify deploy`). O build de publicação deixa os rascunhos de fora e atualiza
   o `sitemap.xml`.

**Primeiro artigo publicado:** tire o comentário dos três links "Artigos" no
`index.html` (procure por `ARTIGOS:`), para o item aparecer no menu e no
rodapé, e rode o build de novo.

**Assinatura:** nome, CRM e RQE da Dra. Célia ficam em `conteudo/autora.txt` e
valem para todos os artigos.
