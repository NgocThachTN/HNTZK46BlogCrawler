import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export interface MemberProfileInfo {
  id: string;
  name: string;
  kana: string;
  nameEn: string;
  birthday: string;
  zodiac: string;
  height: string;
  birthplace: string;
  bloodType: string;
  generation: string;
}

const MEMBER_IDS = [
  // 2nd Gen
  '12', '14',
  // 3rd Gen
  '21', '22', '23', '24',
  // 4th Gen
  '25', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36',
  // 5th Gen
  '37', '38', '39', '40', '41', '42', '43', '44', '45', '46',
  // Mascot
  '000'
];

function getGenLabel(id: string): string {
  if (['12', '14'].includes(id)) return '2期生';
  if (['21', '22', '23', '24'].includes(id)) return '3期生';
  if (['25', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36'].includes(id)) return '4期生';
  if (['37', '38', '39', '40', '41', '42', '43', '44', '45', '46'].includes(id)) return '5期生';
  if (id === '000') return 'Official Mascot (公式マスコット)';
  return 'メンバー';
}

async function fetchMember(id: string): Promise<MemberProfileInfo | null> {
  if (id === '000') {
    return {
      id: '000',
      name: 'ポカ',
      kana: 'ぽか',
      nameEn: 'POKA',
      birthday: '2019年12月25日',
      zodiac: 'やぎ座',
      height: '??? cm',
      birthplace: '日向坂',
      bloodType: '不明',
      generation: 'Official Mascot (公式マスコット)'
    };
  }

  try {
    const url = `https://www.hinatazaka46.com/s/official/artist/${id}?ima=0000`;
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000,
    });
    const $ = cheerio.load(res.data);

    const nameInfoEl = $('.c-member__name--info');
    const nameEn = nameInfoEl.find('.name_en').text().trim();
    const name = nameInfoEl.clone().children().remove().end().text().replace(/\s+/g, ' ').trim();
    const kana = $('.c-member__kana').text().replace(/\s+/g, ' ').trim();

    let birthday = '';
    let zodiac = '';
    let height = '';
    let birthplace = '';
    let bloodType = '';

    $('td.c-member__info-td__name').each((_, el) => {
      const label = $(el).text().trim();
      const val = $(el).next().text().trim();
      if (label.includes('生年月日')) birthday = val;
      if (label.includes('星座')) zodiac = val;
      if (label.includes('身長')) height = val;
      if (label.includes('出身地')) birthplace = val;
      if (label.includes('血液型')) bloodType = val;
    });

    return {
      id,
      name: name || '',
      kana: kana || '',
      nameEn: nameEn || '',
      birthday: birthday || '未公開',
      zodiac: zodiac || '未公開',
      height: height || '未公開',
      birthplace: birthplace || '未公開',
      bloodType: bloodType || '未公開',
      generation: getGenLabel(id)
    };
  } catch (err: any) {
    console.error(`Error fetching ID ${id}:`, err.message);
    return null;
  }
}

async function main() {
  console.log('Fetching all 28 member official profiles...');
  const result: Record<string, MemberProfileInfo> = {};
  for (const id of MEMBER_IDS) {
    const data = await fetchMember(id);
    if (data) {
      result[id] = data;
      console.log(`✓ ID ${id}: ${data.name} (${data.nameEn} / ${data.kana}) | 生年月日: ${data.birthday} | 星座: ${data.zodiac} | 身長: ${data.height} | 出身地: ${data.birthplace} | 血液型: ${data.bloodType}`);
    }
  }

  const outPath = path.join(process.cwd(), 'src', 'data', 'members-profiles.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Saved successfully to ${outPath}`);
}

main();
