# Hinatazaka46 Blog Archive and Morphological Furigana Database

<<<<<<< HEAD
This repository automatically archives official diaries from Hinatazaka46 members, compresses image assets to optimize storage efficiency, and compiles Japanese text into dynamic Hiragana Furigana tags using morphological analysis.

The archiving process runs periodically via GitHub Actions, establishing a persistent, self-updating, and high-performance Japanese learning and reading resource.

## Project Contribution Calendar

This grid displays the total crawled blog posts across all members over the last 20 weeks (from oldest W1 to newest W20):

| Day | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 | W11 | W12 | W13 | W14 | W15 | W16 | W17 | W18 | W19 | W20 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sun | ░ | ░ | ░ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ |
| Mon | ▒ | ░ | ░ | █ | █ | █ | █ | █ | █ | █ | █ | █ | ▓ | ▒ | ░ | ▓ | █ | ▓ | █ | █ |
| Tue | ░ | ░ | ░ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | ▓ | █ | █ | █ | █ | ▒ |
| Wed | ░ | ░ | ▒ | █ | █ | █ | ▓ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | ░ |
| Thu | ░ | ░ | ░ | █ | ▓ | ▓ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | █ | ░ |
| Fri | ░ | ░ | ░ | █ | ▓ | █ | █ | █ | █ | █ | █ | █ | █ | ▓ | █ | █ | █ | █ | █ | ░ |
| Sat | ▒ | ░ | █ | █ | █ | █ | █ | █ | █ | █ | ▓ | █ | █ | ▒ | ▒ | ▒ | █ | █ | █ | ░ |


Key: Light (░ = 0 posts), Medium (▒ = 1 post), Dark (▓ = 2 posts), Full (█ = 3+ posts)

## Member Statistics and Activity

- Total active members: 28
- Total archived blog posts: 646
- Total optimized images: 3461
- Database last updated: 5/26/2026, 17:35:54 (Indochina Time)

### Member Progress Dashboard

| No | Member Name | Romaji Slug | 30-Day Activity Sparkline | Total Posts | Oldest Post | Newest Post |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 金村 美玖 | kanemura.miku | `░░▒░░░░░░░░░▒░░░░░░░░░░░▒░░░░░` | 61 | 2024.12.31 15:13 | 2026.5.21 21:34 |
| 2 | 小坂 菜緒 | kosaka.nao | `░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒░` | 3 | 2026.2.28 21:59 | 2026.5.25 22:04 |
| 3 | 上村 ひなの | kamimura.hinano | `░░░░░░░░░░░░░░░░░░░░▒░░▒░░░░░░` | 12 | 2026.2.1 22:53 | 2026.5.20 23:06 |
| 4 | 髙橋 未来虹 | takahashi.mikuni | `░░░░░░░▒▒░░░░▒░░░░░░░▒░▒░░▒░░░` | 19 | 2026.2.11 12:00 | 2026.5.23 20:26 |
| 5 | 森本 茉莉 | morimoto.marie | `░▒░▒░░░░░░░░░░░░░░░░░░▒▒░░░░░░` | 17 | 2026.2.3 21:28 | 2026.5.20 19:05 |
| 6 | 山口 陽世 | yamaguchi.haruyo | `░░░░░░░░░░░▒░░░░░░░░░░▒░░▒░░░░` | 16 | 2026.2.9 22:03 | 2026.5.22 17:59 |
| 7 | 石塚 瑶季 | ishizuka.tamaki | `░░░░▒░░░░░░░░░▒░░░░░▒░░▒░░░░░░` | 24 | 2026.2.1 17:12 | 2026.5.20 19:53 |
| 8 | 小西 夏菜実 | konishi.nanami | `░░░░░░░░░░░░▒░░░░░░░░░░░░░░░░░` | 9 | 2026.2.2 20:27 | 2026.5.9 21:13 |
| 9 | 清水 理央 | shimizu.rio | `░░░░░░░░░░░░░▒░░░░░░░░░▒░░░░░░` | 8 | 2026.2.4 22:25 | 2026.5.20 20:49 |
| 10 | 正源司 陽子 | shogenji.yoko | `░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░` | 9 | 2026.2.9 20:19 | 2026.4.26 22:01 |
| 11 | 竹内 希来里 | takeuchi.kirari | `░░░▒░░░░░░░░░░░░░░░░░░░░░░░░░░` | 7 | 2026.2.4 22:02 | 2026.4.30 18:34 |
| 12 | 平尾 帆夏 | hirao.honoka | `░░░░░░░░░▒░░░░░░░░░░░░░░░░░░░░` | 9 | 2026.2.22 20:27 | 2026.5.6 20:53 |
| 13 | 平岡 海月 | hiraoka.mitsuki | `░░░▒░░░░░░░░░░░░░░░░░░░░░░░░░░` | 4 | 2026.2.16 22:45 | 2026.4.30 20:42 |
| 14 | 藤嶌 果歩 | fujishima.kaho | `▒░░░░░▒░░░░░░░░▒░░░░▒░▒▒░░▒░░░` | 26 | 2026.2.3 22:53 | 2026.5.23 21:08 |
| 15 | 宮地 すみれ | miyachi.sumire | `░░░▒░░░░░░░░░░░░░░░░░░░░░░░░░░` | 8 | 2026.2.5 19:46 | 2026.4.30 22:10 |
| 16 | 山下 葉留花 | yamashita.haruka | `░░▒░░░░░░░░░░░░░░░░▒░░░▒░░░░░░` | 10 | 2026.2.7 21:35 | 2026.5.20 23:45 |
| 17 | 渡辺 莉奈 | watanabe.rina | `░░░░▒░░░░░░░░░░░░▒░░░▒░░░░░░░░` | 7 | 2026.2.6 22:42 | 2026.5.18 18:19 |
| 18 | 大田 美月 | ota.mitsuki | `░▒░▒▒░░▒░░▒░▒░░░▒▒░▒░▒▒░▒▒░▒░░` | 63 | 2026.1.31 20:45 | 2026.5.24 19:06 |
| 19 | 大野 愛実 | ono.manami | `░░░░░░░▒▒░░░░░░░░░░░░░░░▒░░░░░` | 10 | 2026.2.1 20:21 | 2026.5.21 19:05 |
| 20 | 片山 紗希 | katayama.saki | `░▒▒▒▒░▒░▒░▒░▒▒░▒░░▒▒░▒▒▒░░▒▒░▒` | 65 | 2026.2.1 20:46 | 2026.5.26 11:47 |
| 21 | 蔵盛 妃那乃 | kuramori.hinano | `░░░▓░░░▒▒░░▒░░░░░░░░▒▒▒▒░░▒░▒░` | 38 | 2026.1.31 22:22 | 2026.5.25 21:42 |
| 22 | 坂井 新奈 | sakai.niina | `░░░▒░░▒░░▒░░▒░░░░▒░░▒░░░▒░░░░░` | 24 | 2026.2.2 16:19 | 2026.5.21 12:37 |
| 23 | 佐藤 優羽 | sato.yuu | `▒░░░▒░▒░░▒░░░▒░░░░▒░▒▒░░░▒░░▒░` | 44 | 2026.2.1 18:30 | 2026.5.25 12:01 |
| 24 | 下田 衣珠季 | shimoda.izuki | `░░░▒░░░░░▒░░░░░░▒░░░░░░▒░░░░░░` | 17 | 2026.1.31 19:05 | 2026.5.20 13:57 |
| 25 | 高井 俐香 | takai.rika | `░▒░░▒░░░▒░░░▒░░░░░▒░░░░▒░▒░░▒░` | 35 | 2026.2.2 15:54 | 2026.5.25 16:39 |
| 26 | 鶴崎 仁香 | tsurusaki.nika | `░░▒▒▒▒░░░▒▒▒░░▒░▒░░▒░░▒▒░░░▒░░` | 52 | 2026.2.2 13:58 | 2026.5.24 21:03 |
| 27 | 松尾 桜 | matsuo.sakura | `░▒░░░░░░░░░▒░░░░░░▒░░▒░░▒░░░▒░` | 27 | 2026.2.4 16:08 | 2026.5.25 14:18 |
| 28 | ポカ | poka | `░░░░░░░░▒░░▒░░░▒░░░▒░░░▓░░░░▒░` | 22 | 2026.2.1 13:32 | 2026.5.25 22:25 |

=======
This repository automatically archives the Hinatazaka46 official blogs, compresses all image assets for optimal storage efficiency, and compiles Kanji characters into dynamic Hiragana Furigana tags using morphological analysis.

The archival is performed periodically using GitHub Actions, ensuring a persistent, self-updating, and high-performance Japanese learning and reading database.

## Thong ke hoat dong 7 ngay qua

| STT | Thanh vien | 26/05 | 25/05 | 24/05 | 23/05 | 22/05 | 21/05 | 20/05 | Tong 7 ngay |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 金村 美玖 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 2 | 小坂 菜緒 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| 3 | 上村 ひなの | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| 4 | 髙橋 未来虹 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 2 |
| 5 | 森本 茉莉 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| 6 | 山口 陽世 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| 7 | 石塚 瑶季 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| 8 | 小西 夏菜実 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 9 | 清水 理央 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| 10 | 正源司 陽子 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 11 | 竹内 希来里 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 12 | 平尾 帆夏 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 13 | 平岡 海月 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 14 | 藤嶌 果歩 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 2 |
| 15 | 宮地 すみれ | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 16 | 山下 葉留花 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| 17 | 渡辺 莉奈 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 18 | 大田 美月 | 0 | 0 | 1 | 0 | 1 | 1 | 0 | 3 |
| 19 | 大野 愛実 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 20 | 片山 紗希 | 1 | 0 | 1 | 1 | 0 | 0 | 1 | 4 |
| 21 | 蔵盛 妃那乃 | 0 | 1 | 0 | 1 | 0 | 0 | 1 | 3 |
| 22 | 坂井 新奈 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 23 | 佐藤 優羽 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 2 |
| 24 | 下田 衣珠季 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| 25 | 高井 俐香 | 0 | 1 | 0 | 0 | 1 | 0 | 1 | 3 |
| 26 | 鶴崎 仁香 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 2 |
| 27 | 松尾 桜 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 2 |
| 28 | ポカ | 0 | 1 | 0 | 0 | 0 | 0 | 2 | 3 |


## Thong ke chi tiet tung thanh vien

- Tong so thanh vien hoat dong: 28
- Tong so bai viet da luu tru: 666
- Tong so hinh anh da toi uu hoa: 3603
- Thoi gian cap nhat cuoi cung: 17:34:22 26/5/2026 (Indochina Time)

### Kho luu tru thanh vien

| STT | Thanh vien | Romaji Slug | Tong so bai | Ngay bat dau | Bai moi nhat |
| --- | --- | --- | --- | --- | --- |
| 1 | 金村 美玖 | kanemura.miku | 81 | 2024.9.5 19:38 | 2026.5.21 21:34 |
| 2 | 小坂 菜緒 | kosaka.nao | 3 | 2026.2.28 21:59 | 2026.5.25 22:04 |
| 3 | 上村 ひなの | kamimura.hinano | 12 | 2026.2.1 22:53 | 2026.5.20 23:06 |
| 4 | 髙橋 未来虹 | takahashi.mikuni | 19 | 2026.2.11 12:00 | 2026.5.23 20:26 |
| 5 | 森本 茉莉 | morimoto.marie | 17 | 2026.2.3 21:28 | 2026.5.20 19:05 |
| 6 | 山口 陽世 | yamaguchi.haruyo | 16 | 2026.2.9 22:03 | 2026.5.22 17:59 |
| 7 | 石塚 瑶季 | ishizuka.tamaki | 24 | 2026.2.1 17:12 | 2026.5.20 19:53 |
| 8 | 小西 夏菜実 | konishi.nanami | 9 | 2026.2.2 20:27 | 2026.5.9 21:13 |
| 9 | 清水 理央 | shimizu.rio | 8 | 2026.2.4 22:25 | 2026.5.20 20:49 |
| 10 | 正源司 陽子 | shogenji.yoko | 9 | 2026.2.9 20:19 | 2026.4.26 22:01 |
| 11 | 竹内 希来里 | takeuchi.kirari | 7 | 2026.2.4 22:02 | 2026.4.30 18:34 |
| 12 | 平尾 帆夏 | hirao.honoka | 9 | 2026.2.22 20:27 | 2026.5.6 20:53 |
| 13 | 平岡 海月 | hiraoka.mitsuki | 4 | 2026.2.16 22:45 | 2026.4.30 20:42 |
| 14 | 藤嶌 果歩 | fujishima.kaho | 26 | 2026.2.3 22:53 | 2026.5.23 21:08 |
| 15 | 宮地 すみれ | miyachi.sumire | 8 | 2026.2.5 19:46 | 2026.4.30 22:10 |
| 16 | 山下 葉留花 | yamashita.haruka | 10 | 2026.2.7 21:35 | 2026.5.20 23:45 |
| 17 | 渡辺 莉奈 | watanabe.rina | 7 | 2026.2.6 22:42 | 2026.5.18 18:19 |
| 18 | 大田 美月 | ota.mitsuki | 63 | 2026.1.31 20:45 | 2026.5.24 19:06 |
| 19 | 大野 愛実 | ono.manami | 10 | 2026.2.1 20:21 | 2026.5.21 19:05 |
| 20 | 片山 紗希 | katayama.saki | 65 | 2026.2.1 20:46 | 2026.5.26 11:47 |
| 21 | 蔵盛 妃那乃 | kuramori.hinano | 38 | 2026.1.31 22:22 | 2026.5.25 21:42 |
| 22 | 坂井 新奈 | sakai.niina | 24 | 2026.2.2 16:19 | 2026.5.21 12:37 |
| 23 | 佐藤 優羽 | sato.yuu | 44 | 2026.2.1 18:30 | 2026.5.25 12:01 |
| 24 | 下田 衣珠季 | shimoda.izuki | 17 | 2026.1.31 19:05 | 2026.5.20 13:57 |
| 25 | 高井 俐香 | takai.rika | 35 | 2026.2.2 15:54 | 2026.5.25 16:39 |
| 26 | 鶴崎 仁香 | tsurusaki.nika | 52 | 2026.2.2 13:58 | 2026.5.24 21:03 |
| 27 | 松尾 桜 | matsuo.sakura | 27 | 2026.2.4 16:08 | 2026.5.25 14:18 |
| 28 | ポカ | poka | 22 | 2026.2.1 13:32 | 2026.5.25 22:25 |

>>>>>>> d94138f231e1ce144abffcce74d1a541b64610e4

## Technical Setup

### Installation

<<<<<<< HEAD
Install the required Node.js dependencies:
=======
Install all required Node.js dependencies:
>>>>>>> d94138f231e1ce144abffcce74d1a541b64610e4

```bash
npm install
```

### Local Development

<<<<<<< HEAD
Launch the interactive Vite development server locally:
=======
Start the interactive Vite development server locally:
>>>>>>> d94138f231e1ce144abffcce74d1a541b64610e4

```bash
npm run dev
```

### Run Crawler Manually

Trigger the incremental morphological compiler and image optimizer manually:

```bash
npm run crawl
```

### Build Production Bundle

<<<<<<< HEAD
Compile the TypeScript application and build the static production bundle:
=======
Compile the TypeScript application and build the static bundle for production:
>>>>>>> d94138f231e1ce144abffcce74d1a541b64610e4

```bash
npm run build
```
