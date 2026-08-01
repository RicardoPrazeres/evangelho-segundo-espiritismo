import sys
sys.path.insert(0, '/Users/ricardo/Library/Python/3.9/lib/python/site-packages')
import pypdf, re, json

pdf_path = '/Users/ricardo/Desktop/evangelho-guillon.pdf'
reader = pypdf.PdfReader(pdf_path)

chapter_configs = [
    {'id': 'prefacio', 'number': 0, 'title': 'Prefácio', 'subtitle': 'O Espírito de Verdade', 'start_page': 15, 'end_page': 16},
    {'id': 'introducao', 'number': 0.1, 'title': 'Introdução', 'subtitle': 'Objetivo, Autoridade da Doutrina, Notícias Históricas e Sócrates/Platão', 'start_page': 17, 'end_page': 40},
    {'id': 'cap-1', 'number': 1, 'title': 'Capítulo I - Não vim destruir a lei', 'subtitle': 'Moisés • O Cristo • O Espiritismo • Aliança da Ciência e da Religião', 'start_page': 41, 'end_page': 50},
    {'id': 'cap-2', 'number': 2, 'title': 'Capítulo II - Meu Reino não é deste mundo', 'subtitle': 'A vida futura • A realeza terrestre • Pôncio Pilatos', 'start_page': 51, 'end_page': 56},
    {'id': 'cap-3', 'number': 3, 'title': 'Capítulo III - Há muitas moradas na casa de meu Pai', 'subtitle': 'Diferentes estados da alma no Erraticidade • Categorias de mundos habitados', 'start_page': 57, 'end_page': 66},
    {'id': 'cap-4', 'number': 4, 'title': 'Capítulo IV - Ninguém poderá ver o Reino de Deus se não nascer de novo', 'subtitle': 'Ressurreição e Reencarnação • Nicodemos • Pluralidade das existências', 'start_page': 67, 'end_page': 78},
    {'id': 'cap-5', 'number': 5, 'title': 'Capítulo V - Bem-aventurados os aflitos', 'subtitle': 'Justiça das aflições • Causas atuais e anteriores • Motivos de resignação', 'start_page': 79, 'end_page': 104},
    {'id': 'cap-6', 'number': 6, 'title': 'Capítulo VI - O Cristo Consolador', 'subtitle': 'O jugo leve • O Consolador Prometido • Instruções dos Espíritos', 'start_page': 105, 'end_page': 110},
    {'id': 'cap-7', 'number': 7, 'title': 'Capítulo VII - Bem-aventurados os pobres de espírito', 'subtitle': 'O orgulho e a humildade • Quem se humilhar será exaltado', 'start_page': 111, 'end_page': 122},
    {'id': 'cap-8', 'number': 8, 'title': 'Capítulo VIII - Bem-aventurados os que têm puro o coração', 'subtitle': 'Simplicidade e pureza • Deixai vir a mim as criancinhas • Pecado por pensamento', 'start_page': 123, 'end_page': 134},
    {'id': 'cap-9', 'number': 9, 'title': 'Capítulo IX - Bem-aventurados os que são brandos e pacíficos', 'subtitle': 'Mansidão e pacificação • A cólera, a afabilidade e a doçura', 'start_page': 135, 'end_page': 140},
    {'id': 'cap-10', 'number': 10, 'title': 'Capítulo X - Bem-aventurados os que são misericordiosos', 'subtitle': 'Perdoai para que Deus vos perdoe • A trave no olho • O perdão das ofensas', 'start_page': 141, 'end_page': 152},
    {'id': 'cap-11', 'number': 11, 'title': 'Capítulo XI - Amar o próximo como a si mesmo', 'subtitle': 'O maior mandamento • A lei do amor • A caridade para com os imperfeitos', 'start_page': 153, 'end_page': 164},
    {'id': 'cap-12', 'number': 12, 'title': 'Capítulo XII - Amai os vossos inimigos', 'subtitle': 'Retribuir o mal com o bem • Os inimigos desencarnados • Se alguém te bater numa face', 'start_page': 165, 'end_page': 174},
    {'id': 'cap-13', 'number': 13, 'title': 'Capítulo XIII - Não saiba a vossa mão esquerda o que dê a vossa mão direita', 'subtitle': 'Fazer o bem sem ostentação • Os óbolos da viúva • A caridade discreta', 'start_page': 175, 'end_page': 196},
    {'id': 'cap-14', 'number': 14, 'title': 'Capítulo XIV - Honrai a vosso pai e a vossa mãe', 'subtitle': 'Piedade filial • Parentesco corporal e espiritual • A ingratidão dos filhos', 'start_page': 197, 'end_page': 206},
    {'id': 'cap-15', 'number': 15, 'title': 'Capítulo XV - Fora da caridade não há salvação', 'subtitle': 'O bom Samaritano • O mandamento maior • A caridade sem limites', 'start_page': 207, 'end_page': 214},
    {'id': 'cap-16', 'number': 16, 'title': 'Capítulo XVI - Não se pode servir a Deus e a Mamon', 'subtitle': 'Salvação dos ricos • Parábola do mau rico • Utilidade providencial da riqueza', 'start_page': 215, 'end_page': 230},
    {'id': 'cap-17', 'number': 17, 'title': 'Capítulo XVII - Sede perfeitos', 'subtitle': 'Caracteres da perfeição • O homem de bem • Os bons espíritas • O dever', 'start_page': 231, 'end_page': 242},
    {'id': 'cap-18', 'number': 18, 'title': 'Capítulo XVIII - Muitos os chamados, poucos os escolhidos', 'subtitle': 'Parábola do festim das bodas • A porta estreita • Pelas suas obras se reconhece o cristão', 'start_page': 243, 'end_page': 252},
    {'id': 'cap-19', 'number': 19, 'title': 'Capítulo XIX - A fé transporta montanhas', 'subtitle': 'Poder da fé • A fé religiosa e a razão • Parábola da figueira que secou', 'start_page': 253, 'end_page': 260},
    {'id': 'cap-20', 'number': 20, 'title': 'Capítulo XX - Os trabalhadores da última hora', 'subtitle': 'Os últimos serão os primeiros • Missão dos espíritas • Os obreiros do Senhor', 'start_page': 261, 'end_page': 266},
    {'id': 'cap-21', 'number': 21, 'title': 'Capítulo XXI - Haverá falsos cristos e falsos profetas', 'subtitle': 'Conhece-se a árvore pelo fruto • Não creais em todos os Espíritos', 'start_page': 267, 'end_page': 276},
    {'id': 'cap-22', 'number': 22, 'title': 'Capítulo XXII - Não separeis o que Deus juntou', 'subtitle': 'Indissolubilidade do casamento • O divórcio', 'start_page': 277, 'end_page': 280},
    {'id': 'cap-23', 'number': 23, 'title': 'Capítulo XXIII - Estranha moral', 'subtitle': 'Odiar os pais • Abandonar pai, mãe e filhos • Deixar aos mortos o cuidado de enterrar seus mortos', 'start_page': 281, 'end_page': 290},
    {'id': 'cap-24', 'number': 24, 'title': 'Capítulo XXIV - Não ponhais a candeia debaixo do alqueire', 'subtitle': 'Por que fala Jesus por parábolas • Não vades ter com os gentios • Coragem da fé', 'start_page': 291, 'end_page': 298},
    {'id': 'cap-25', 'number': 25, 'title': 'Capítulo XXV - Buscai e achareis', 'subtitle': 'Ajuda-te a ti mesmo, que o céu te ajudará • Observai os pássaros do céu', 'start_page': 299, 'end_page': 304},
    {'id': 'cap-26', 'number': 26, 'title': 'Capítulo XXVI - Dai gratuitamente o que gratuitamente recebestes', 'subtitle': 'Dom de curar • Preces pagas • Mediunidade gratuita', 'start_page': 305, 'end_page': 310},
    {'id': 'cap-27', 'number': 27, 'title': 'Capítulo XXVII - Pedi e obtereis', 'subtitle': 'Qualidades e eficácia da prece • Ação da prece e transmissão do pensamento • Preces pelos mortos', 'start_page': 311, 'end_page': 324},
    {'id': 'cap-28', 'number': 28, 'title': 'Capítulo XXVIII - Coletânea de preces espíritas', 'subtitle': 'Preces gerais • Preces por si mesmo • Preces por outrem • Preces pelos mortos • Preces pelos doentes e obsidiados', 'start_page': 325, 'end_page': 370}
]

def clean_page_lines(start_p, end_p):
    raw_lines = []
    for p_idx in range(start_p - 1, end_p):
        p_num = p_idx + 1
        page_text = reader.pages[p_idx].extract_text()
        lines = page_text.split('\n')
        for l in lines:
            l_str = l.strip()
            if not l_str:
                continue
            # Skip page numbers alone
            if l_str == str(p_num) or l_str == str(p_num - 1) or l_str == str(p_num + 1):
                continue
            # Skip running headers
            if re.match(r'^(Capítulo [I|V|X|L|C|D|M]+|\d+|O EVANGELHO SEGUNDO O ESPIRITISMO|FEDERAÇÃO ESPÍRITA BRASILEIRA)$', l_str, re.IGNORECASE) and len(l_str) < 35:
                continue
            raw_lines.append(l_str)

    # Process hyphenation & kerning across all lines
    full_text = '\n'.join(raw_lines)
    full_text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', full_text)

    # Kerning fix function
    def fix_kerning(m):
        first = m.group(1)
        rest = m.group(2)
        if first in ['a', 'e', 'o', 'A', 'E', 'O', 'à', 'À', 'u', 'U']:
            return m.group(0)
        return first + rest

    full_text = re.sub(r'\b([A-ZÀ-Úa-zà-ú])\s([a-zà-ú]{2,})\b', fix_kerning, full_text)
    return full_text.split('\n')

def process_chapter(cfg):
    lines = clean_page_lines(cfg['start_page'], cfg['end_page'])
    sections = []
    
    current_sec_title = "Conteúdo Principal"
    current_paras = []
    current_buf = []

    def flush_para():
        if current_buf:
            text = ' '.join(current_buf).strip()
            if text:
                current_paras.append(text)
            current_buf.clear()

    def flush_sec():
        flush_para()
        if current_paras:
            sections.append({
                'title': current_sec_title,
                'content': list(current_paras)
            })
            current_paras.clear()

    sec_header_regex = re.compile(r'^(Instruções dos Espíritos|Moisés|O Cristo|O Espiritismo|Aliança da Ciência e da Religião|A nova era|I\s*–|II\s*–|III\s*–|IV\s*–|V\s*–|Preces gerais|Preces por aquele mesmo|Preces por outrem|Preces pelos que já não|Preces pelos doentes)', re.IGNORECASE)

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue

        # Detect Section Heading
        if sec_header_regex.match(line_clean) and len(line_clean) < 70:
            flush_sec()
            current_sec_title = line_clean
            continue

        # Detect Item Number (e.g. '1. ', '2. ', '3. ', '4. ') or Roman Numeral ('I. ', 'II. ')
        is_item_start = bool(re.match(r'^(\d+|[I|V|X|L|C|D|M]+)\.\s+', line_clean))

        if is_item_start:
            flush_para()
            current_buf.append(line_clean)
        else:
            if current_buf:
                last_line = current_buf[-1]
                # If last line ended with punctuation and this line looks like a new paragraph (starts with capital)
                if re.search(r'[\.:!\?"]$', last_line) and re.match(r'^[A-ZÀ-Ú"“]', line_clean) and len(current_buf) >= 3:
                    flush_para()
                    current_buf.append(line_clean)
                else:
                    current_buf.append(line_clean)
            else:
                current_buf.append(line_clean)

    flush_sec()

    if not sections:
        sections = [{'title': cfg['title'], 'content': [' '.join(lines)]}]

    # Generate rich summary
    first_para = sections[0]['content'][0] if sections and sections[0]['content'] else cfg['subtitle']
    summary = first_para[:250] + '...' if len(first_para) > 250 else first_para

    return {
        'id': cfg['id'],
        'number': cfg['number'],
        'title': cfg['title'],
        'subtitle': cfg['subtitle'],
        'summary': summary,
        'sections': sections
    }

out_chapters = []
for cfg in chapter_configs:
    print(f"Extracting {cfg['id']}: {cfg['title']}...")
    chap_obj = process_chapter(cfg)
    out_chapters.append(chap_obj)

book_data = {
    'meta': {
        'title': 'O Evangelho Segundo o Espiritismo',
        'author': 'Allan Kardec',
        'translator': 'Guillon Ribeiro (131ª Edição Histórica - FEB)',
        'subtitle': 'Com a explicação das máximas morais do Cristo em concordância com o Espiritismo e suas aplicações às diversas circunstâncias da vida.'
    },
    'chapters': out_chapters
}

out_path = '/Users/ricardo/Desktop/evangelho-segundo-espiritismo/js/book-data.js'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('const BOOK_DATA = ')
    json.dump(book_data, f, ensure_ascii=False, indent=2)
    f.write(';\n')

print(f"Finished writing {out_path}! Chapters: {len(out_chapters)}")
