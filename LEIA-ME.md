# Rifa Solidária – instalação na HostGator

Dois endereços, mesma rifa:

- **Comprador:** `https://SEUSITE.com.br/rifa/` → só escolhe os números e envia pelo WhatsApp.
- **Vendedor:** `https://SEUSITE.com.br/rifa/vendedor.html` → pede senha; marca vendas, informa nomes, abre/baixa Excel.

## Passos (cPanel da HostGator)

1. Abra `config.php` e troque `TROCAR-ESTA-SENHA` pela senha do vendedor (o sistema não deixa entrar com a senha padrão).
2. No cPanel, abra **Gerenciador de Arquivos** → `public_html` → crie a pasta `rifa`.
3. Envie para dentro dela **todos** os arquivos deste projeto, mantendo a pasta `data/`:
   `index.html, vendedor.html, app.js, style.css, api.php, config.php, .htaccess, data/.htaccess`
   (mostre arquivos ocultos no Gerenciador para enxergar os `.htaccess`).
4. Dê permissão de escrita (755 ou 775) à pasta `data/`. O arquivo `data/rifa.json` é criado sozinho na primeira venda.
5. Abra os dois endereços e teste: entre no vendedor, marque um número, abra o link do comprador e veja o número como vendido. Depois desmarque.

## Observações
- Os nomes dos participantes **não** são enviados ao comprador, só quais números estão vendidos.
- Para backup, baixe `data/rifa.json` ou use **Baixar Excel** no painel do vendedor.
- Precisa de PHP 7.4+ (a HostGator já oferece).
