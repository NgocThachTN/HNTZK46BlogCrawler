import React, { useState } from 'react';
import type { Member, BlogPost } from '../types/blog';
import membersProfileJson from '../data/members-profiles.json';
import '../styles/member-profile.css';

interface MemberProfileHeroProps {
  member: Member;
  blogs: BlogPost[];
  onBack: () => void;
  onReadLatest: (blog: BlogPost) => void;
}

interface MemberDetail {
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

const profileDataMap = membersProfileJson as Record<string, MemberDetail>;

// Format birthday e.g. "2006年9月10日" -> "September 10, 2006"
const formatBirthday = (bday: string): string => {
  if (!bday) return 'N/A';
  const match = bday.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return bday;
  const year = match[1];
  const monthNum = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = months[monthNum - 1] || match[2];
  return `${monthName} ${day}, ${year}`;
};

// Format zodiac sign to English
const formatZodiac = (zodiac: string): string => {
  if (!zodiac) return 'N/A';
  const map: Record<string, string> = {
    'おひつじ座': 'Aries',
    'おうし座': 'Taurus',
    'ふたご座': 'Gemini',
    'かに座': 'Cancer',
    'しし座': 'Leo',
    'おとめ座': 'Virgo',
    'てんびん座': 'Libra',
    'さそり座': 'Scorpio',
    'いて座': 'Sagittarius',
    'やぎ座': 'Capricorn',
    'みずがめ座': 'Aquarius',
    'うお座': 'Pisces',
  };
  return map[zodiac.trim()] || zodiac;
};

// Format birthplace to English
const formatBirthplace = (place: string): string => {
  if (!place) return 'N/A';
  const map: Record<string, string> = {
    '東京都': 'Tokyo, Japan',
    '大阪府': 'Osaka, Japan',
    '埼玉県': 'Saitama, Japan',
    '神奈川県': 'Kanagawa, Japan',
    '兵庫県': 'Hyogo, Japan',
    '千葉県': 'Chiba, Japan',
    '愛知県': 'Aichi, Japan',
    '福岡県': 'Fukuoka, Japan',
    '広島県': 'Hiroshima, Japan',
    '福井県': 'Fukui, Japan',
    '鳥取県': 'Tottori, Japan',
    '北海道': 'Hokkaido, Japan',
    '日向坂': 'Hinatazaka',
  };
  return map[place.trim()] || place.replace(/県|府|都/, '');
};

// Format blood type to English
const formatBloodType = (type: string): string => {
  if (!type || type === '不明') return 'Unknown';
  const clean = type.replace('型', '').trim();
  return clean ? `Type ${clean}` : type;
};

export const MemberProfileHero: React.FC<MemberProfileHeroProps> = ({
  member,
  blogs,
  onBack,
  onReadLatest,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Get official scraped profile data or fallbacks
  const detail: MemberDetail = profileDataMap[member.id] || {
    id: member.id,
    name: member.name,
    kana: '',
    nameEn: member.slug ? member.slug.split('.').map(s => s.toUpperCase()).join(' ') : `MEMBER #${member.id}`,
    birthday: 'N/A',
    zodiac: 'N/A',
    height: 'N/A',
    birthplace: 'N/A',
    bloodType: 'N/A',
    generation: 'Member'
  };

  const getGenEnglish = (id: string, genStr: string): string => {
    if (['12', '14'].includes(id) || genStr.includes('2期')) return '2nd Gen';
    if (['21', '22', '23', '24'].includes(id) || genStr.includes('3期')) return '3rd Gen';
    if (['25', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36'].includes(id) || genStr.includes('4期')) return '4th Gen';
    if (['37', '38', '39', '40', '41', '42', '43', '44', '45', '46'].includes(id) || genStr.includes('5期')) return '5th Gen';
    if (id === '000' || genStr.includes('ポカ')) return 'Official Mascot';
    return 'Active Member';
  };

  const genLabel = getGenEnglish(member.id, detail.generation);

  // Sort blogs chronologically
  const sortedBlogs = [...blogs].sort((a, b) => {
    return new Date(b.date.replace(/\./g, '/')).getTime() - new Date(a.date.replace(/\./g, '/')).getTime();
  });

  const latestBlog = sortedBlogs[0] || null;
  const totalPhotos = blogs.reduce((acc, b) => acc + (b.images?.length || 0), 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="member-hero-card animate-fade-in">
      <div className="member-hero-bg-glow" />

      {/* Top Header Row with Navigation & Generation Badge */}
      <div className="member-hero-topbar">
        <button className="member-hero-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>All Members</span>
        </button>

        <div className="member-hero-badges">
          <span className="member-gen-pill">{genLabel}</span>
          <span className="member-status-pill">Active</span>
        </div>
      </div>

      {/* Main Profile Layout */}
      <div className="member-profile-main">
        {/* 1. Left: Avatar Showcase without animated glowing circle */}
        <div className="member-avatar-showcase">
          <img
            src={member.avatar}
            alt={member.name}
            className="member-avatar-large"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/favicon.svg';
            }}
          />
          <span className="member-id-tag">#{member.id}</span>
        </div>

        {/* 2. Center: Identity & Name Group */}
        <div className="member-info-column">
          <div className="member-name-header">
            <h1 className="member-kanji-name">{detail.name || member.name}</h1>
            <span className="member-english-name">{detail.nameEn}</span>
          </div>

          {detail.kana && (
            <div className="member-kana-name">{detail.kana}</div>
          )}

          <div className="member-summary-badge-row">
            <span className="member-meta-chip">{genLabel}</span>
            <span className="member-meta-chip">{blogs.length} posts archived</span>
          </div>

          {/* Quick Action Buttons */}
          <div className="member-hero-actions">
            {latestBlog && (
              <button className="member-action-btn primary" onClick={() => onReadLatest(latestBlog)}>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Read Latest Post ({latestBlog.date.split(' ')[0]})</span>
              </button>
            )}

            <button className="member-action-btn secondary" onClick={handleCopyLink}>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>{copied ? 'Copied Link' : 'Share Profile'}</span>
            </button>
          </div>
        </div>

        {/* 3. Right: Official Profile Metadata Table in Pure English */}
        <div className="member-details-table-wrapper">
          <table className="member-official-table">
            <tbody>
              <tr>
                <th className="profile-label">Birthday</th>
                <td className="profile-value">{formatBirthday(detail.birthday)}</td>
              </tr>
              <tr>
                <th className="profile-label">Zodiac</th>
                <td className="profile-value">{formatZodiac(detail.zodiac)}</td>
              </tr>
              <tr>
                <th className="profile-label">Height</th>
                <td className="profile-value">{detail.height}</td>
              </tr>
              <tr>
                <th className="profile-label">Birthplace</th>
                <td className="profile-value">{formatBirthplace(detail.birthplace)}</td>
              </tr>
              <tr>
                <th className="profile-label">Blood Type</th>
                <td className="profile-value">{formatBloodType(detail.bloodType)}</td>
              </tr>
              <tr>
                <th className="profile-label">Total Photos</th>
                <td className="profile-value">{totalPhotos.toLocaleString()} photos</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
