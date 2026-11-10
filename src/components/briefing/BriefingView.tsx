'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { EventItem, EVENT_TYPE_LABELS } from '@/types/database';
import { EmployeeBadge } from '../agenda/EmployeeBadge';
import {
  Share2,
  Download,
  Sparkles,
  CheckCircle2,
  Building,
  Calendar,
  Clock,
  Plus,
  Trash2,
  ArrowLeft,
  Video,
  Link as LinkIcon,
  FileText,
  AlertCircle,
  Search,
  ChevronRight,
  Save,
  Eye,
} from 'lucide-react';

export interface BriefingRefItem {
  rotulo: 'Referência' | 'Exemplo';
  url: string;
}

export interface BriefingVideoItem {
  n: number;
  text: string;
  refs: BriefingRefItem[];
}

export interface BriefingUrlPart {
  type: 'text' | 'link';
  value: string;
  href?: string;
  display?: string;
}

export interface EditableVideoDraft {
  id: string;
  titulo: string;
  formato: string;
  roteiro: string;
  refRotulo: 'Referência' | 'Exemplo';
  refUrl: string;
}

const VIDEO_FORMATS = [
  'Automático',
  'POV',
  'ASMR',
  'Foodporn',
  'Trend',
  'Situação',
  'Entrevista',
  'Preparo',
  'Tutorial',
  'Falado',
  'Conteúdo',
] as const;

const RE_URL = /((?:https?:\/\/|www\.)[^\s<>"']+)/;
const RE_ROTULADO =
  /(refer[eê]ncias?|ref|exemplos?|ex)\s*:?\s*((?:https?:\/\/|www\.|(?:instagram\.com|tiktok\.com|vt\.tiktok\.com|youtube\.com|youtu\.be)\/)[^\s<>"']+)/gi;

export function normalizarUrl(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export function exibirUrl(u: string): string {
  return u.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export function fmtDate(v: string): string {
  if (!v) return '';
  const parts = v.split('-');
  if (parts.length !== 3) return v;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

export function inferCategory(t: string): string {
  const s = t.toLowerCase();
  if (s.includes('asmr')) return 'ASMR';
  if (s.includes('foodporn') || s.includes('food porn')) return 'Foodporn';
  if (s.includes('entrevist') || s.includes('perguntar') || s.includes('ele responder')) return 'Entrevista';
  if (s.includes('pov') || s.includes('óculos meta') || s.includes('oculos meta')) return 'POV';
  if (
    s.includes('cliente:') ||
    s.includes('cliente "') ||
    s.includes('cliente \u201c') ||
    s.includes('comanda') ||
    s.includes('pedir para') ||
    s.includes('fingir') ||
    s.includes('simular') ||
    s.includes('situação') ||
    s.includes('situacao')
  )
    return 'Situação';
  if (s.includes('música em alta') || s.includes('musica em alta') || s.includes('trend')) return 'Trend';
  if (
    s.includes('passo a passo') ||
    s.includes('como eu faço') ||
    s.includes('como eu faco') ||
    s.includes('tutorial')
  )
    return 'Tutorial';
  if (s.includes('prepar')) return 'Preparo';
  if (s.includes('apresentando') || s.includes('falando') || s.includes('mostrar todos')) return 'Falado';
  return 'Conteúdo';
}

export function inferSub(t: string): string {
  const s = t.toLowerCase();
  if (s.includes('carro')) return 'No carro';
  if (s.includes('oriental') || s.includes('sushi') || s.includes('japon')) return 'Linha oriental';
  if (s.includes('pastel')) return 'Linha de pastel';
  if (s.includes('hambúrg') || s.includes('hamburg')) return 'Hamburgueria';
  if (s.includes('óculos meta') || s.includes('oculos meta')) return 'Institucional • Óculos Meta';
  if (s.includes('fábrica') || s.includes('fabrica') || s.includes('24print')) return 'Institucional';
  return 'Geral';
}

export function extrairRefs(texto: string): { texto: string; refs: BriefingRefItem[] } {
  const refs: BriefingRefItem[] = [];
  const limpo = texto.replace(RE_ROTULADO, (_m, rot: string, url: string) => {
    refs.push({
      rotulo: /^ref/i.test(rot) ? 'Referência' : 'Exemplo',
      url: normalizarUrl(url),
    });
    return '';
  });
  return {
    texto: limpo
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    refs,
  };
}

export function parseBodyWithLinks(texto: string): BriefingUrlPart[] {
  const re = new RegExp(RE_URL.source, 'g');
  const parts: BriefingUrlPart[] = [];
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) {
      parts.push({ type: 'text', value: texto.slice(ultimo, m.index) });
    }
    const rawUrl = m[1];
    parts.push({
      type: 'link',
      value: rawUrl,
      href: normalizarUrl(rawUrl),
      display: exibirUrl(rawUrl),
    });
    ultimo = m.index + rawUrl.length;
  }
  if (ultimo < texto.length) {
    parts.push({ type: 'text', value: texto.slice(ultimo) });
  }
  return parts;
}

export function parseItems(raw: string): BriefingVideoItem[] {
  const normalized = raw.replace(/\r/g, '').trim();
  if (!normalized) return [];

  const starts = [...normalized.matchAll(/(?:^|\n)\s*(\d{1,2})\s*[-.)]\s*/g)];
  const montar = (bruto: string, n: number): BriefingVideoItem => {
    const { texto, refs } = extrairRefs(bruto.trim());
    return { n, text: texto, refs };
  };

  if (!starts.length) {
    const rawBlocks = normalized.split(/\n\s*\n+/).filter(Boolean);
    const merged: BriefingVideoItem[] = [];
    for (const block of rawBlocks) {
      const parsed = extrairRefs(block.trim());
      if (!parsed.texto && parsed.refs.length > 0 && merged.length > 0) {
        merged[merged.length - 1].refs.push(...parsed.refs);
      } else {
        merged.push({
          n: merged.length + 1,
          text: parsed.texto,
          refs: parsed.refs,
        });
      }
    }
    return merged;
  }

  return starts.map((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < starts.length ? (starts[i + 1].index ?? normalized.length) : normalized.length;
    return montar(normalized.slice(start, end), Number(m[1]));
  });
}

function draftsFromRaw(raw?: string | null): EditableVideoDraft[] {
  if (!raw || !raw.trim()) {
    return [
      {
        id: 'video-1',
        titulo: '',
        formato: 'Automático',
        roteiro: '',
        refRotulo: 'Referência',
        refUrl: '',
      },
    ];
  }
  const parsed = parseItems(raw);
  if (parsed.length === 0) {
    return [
      {
        id: 'video-1',
        titulo: '',
        formato: 'Automático',
        roteiro: '',
        refRotulo: 'Referência',
        refUrl: '',
      },
    ];
  }
  return parsed.map((item, idx) => {
    let text = item.text;
    let formato = 'Automático';
    let titulo = '';

    // Extrai prefixo opcional "[Formato] Título: " se foi salvo estruturado
    const formatMatch = text.match(/^\[([^\]]+)\]\s*(?:([^\n:]+):\s*)?([\s\S]*)$/);
    if (formatMatch) {
      const candidateFormat = formatMatch[1].trim();
      if (VIDEO_FORMATS.includes(candidateFormat as (typeof VIDEO_FORMATS)[number])) {
        formato = candidateFormat;
        titulo = (formatMatch[2] || '').trim();
        text = formatMatch[3].trim();
      }
    }

    return {
      id: `video-${idx + 1}-${Date.now()}`,
      titulo,
      formato,
      roteiro: text,
      refRotulo: item.refs[0]?.rotulo || 'Referência',
      refUrl: item.refs[0]?.url || '',
    };
  });
}

function serializeDraftsToRaw(drafts: EditableVideoDraft[]): string {
  const valid = drafts.filter((d) => d.roteiro.trim() || d.titulo.trim() || d.refUrl.trim());
  if (valid.length === 0) return '';

  return valid
    .map((d, idx) => {
      const num = idx + 1;
      const prefixFormat = d.formato && d.formato !== 'Automático' ? `[${d.formato}] ` : '';
      const prefixTitle = d.titulo.trim() ? `${d.titulo.trim()}: ` : '';
      const mainBody = `${num} - ${prefixFormat}${prefixTitle}${d.roteiro.trim()}`.trim();
      const refLine = d.refUrl.trim() ? `\n${d.refRotulo}: ${normalizarUrl(d.refUrl.trim())}` : '';
      return `${mainBody}${refLine}`;
    })
    .join('\n\n');
}

function hasBriefingDone(event: EventItem): boolean {
  return Boolean(event.briefing_gravacao && event.briefing_gravacao.trim().length > 0);
}

function countBriefingVideos(event: EventItem): number {
  if (!event.briefing_gravacao || !event.briefing_gravacao.trim()) return 0;
  return parseItems(event.briefing_gravacao).filter((i) => i.text.trim().length > 0).length;
}

function NavegandoBrandLogo() {
  return (
    <svg
      style={{ height: 48, width: 'auto', display: 'block' }}
      viewBox="0 0 1084 613"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Navegando MKT"
    >
      <path
        d="M11.1492 564.243V449.566H30.5806L83.7782 530.397V449.566H103.21V564.243H83.7782L30.5806 483.411V564.243H11.1492ZM136.78 566.632C130.569 566.632 125.313 565.464 121.012 563.128C116.712 560.739 113.447 557.58 111.217 553.651C109.04 549.723 107.952 545.396 107.952 540.671C107.952 536.529 108.642 532.813 110.022 529.521C111.403 526.177 113.526 523.31 116.393 520.921C119.26 518.478 122.977 516.487 127.543 514.948C130.994 513.833 135.028 512.824 139.647 511.922C144.319 511.019 149.363 510.196 154.778 509.453C160.247 508.656 165.954 507.807 171.9 506.904L165.052 510.807C165.105 504.86 163.777 500.48 161.07 497.667C158.362 494.853 153.796 493.446 147.372 493.446C143.497 493.446 139.754 494.348 136.143 496.153C132.533 497.959 130.011 501.064 128.578 505.471L111.058 499.976C113.181 492.702 117.216 486.862 123.163 482.456C129.162 478.049 137.232 475.846 147.372 475.846C155.017 475.846 161.733 477.094 167.52 479.589C173.36 482.084 177.687 486.172 180.501 491.853C182.041 494.879 182.97 497.985 183.289 501.171C183.607 504.303 183.766 507.727 183.766 511.444V564.243H166.963V545.608L169.75 548.634C165.875 554.846 161.335 559.412 156.132 562.332C150.982 565.199 144.532 566.632 136.78 566.632ZM140.603 551.342C144.957 551.342 148.673 550.572 151.752 549.032C154.832 547.493 157.274 545.608 159.079 543.378C160.937 541.148 162.185 539.051 162.822 537.087C163.831 534.645 164.388 531.857 164.494 528.725C164.653 525.54 164.733 522.965 164.733 521L170.626 522.752C164.839 523.655 159.875 524.451 155.734 525.141C151.593 525.832 148.036 526.495 145.063 527.132C142.09 527.716 139.462 528.38 137.179 529.123C134.949 529.92 133.064 530.849 131.524 531.91C129.985 532.972 128.79 534.193 127.941 535.574C127.144 536.954 126.746 538.573 126.746 540.432C126.746 542.555 127.277 544.44 128.339 546.086C129.401 547.679 130.94 548.953 132.958 549.908C135.028 550.864 137.577 551.342 140.603 551.342ZM211.901 564.243L180.683 478.235H199.875L221.537 540.591L243.118 478.235H262.391L231.173 564.243H211.901ZM299.932 566.632C291.225 566.632 283.58 564.748 276.997 560.978C270.413 557.209 265.263 551.979 261.547 545.29C257.884 538.6 256.052 530.902 256.052 522.195C256.052 512.798 257.857 504.648 261.467 497.746C265.078 490.791 270.095 485.402 276.519 481.58C282.943 477.757 290.376 475.846 298.817 475.846C307.737 475.846 315.302 477.943 321.514 482.137C327.779 486.278 332.424 492.145 335.45 499.737C338.476 507.329 339.618 516.275 338.875 526.575H319.841V519.567C319.788 510.223 318.142 503.4 314.904 499.1C311.665 494.8 306.569 492.649 299.614 492.649C291.756 492.649 285.916 495.092 282.093 499.976C278.271 504.807 276.359 511.895 276.359 521.239C276.359 529.946 278.271 536.689 282.093 541.467C285.916 546.245 291.491 548.634 298.817 548.634C303.542 548.634 307.604 547.599 311.002 545.528C314.453 543.405 317.107 540.352 318.965 536.37L337.919 542.104C334.627 549.855 329.531 555.881 322.629 560.182C315.78 564.482 308.214 566.632 299.932 566.632ZM270.307 526.575V512.081H329.477V526.575H270.307ZM380.057 604.858C375.279 604.858 370.686 604.115 366.28 602.628C361.926 601.142 357.998 598.992 354.493 596.178C350.989 593.417 348.123 590.072 345.893 586.143L363.572 577.383C365.218 580.516 367.527 582.825 370.501 584.312C373.527 585.851 376.739 586.621 380.137 586.621C384.118 586.621 387.676 585.904 390.808 584.471C393.94 583.091 396.356 581.02 398.055 578.259C399.807 575.552 400.63 572.154 400.524 568.066V543.617H402.913V478.235H419.716V568.384C419.716 570.561 419.61 572.632 419.398 574.596C419.238 576.613 418.946 578.578 418.522 580.489C417.248 586.064 414.805 590.63 411.195 594.187C407.585 597.797 403.099 600.478 397.736 602.23C392.427 603.982 386.534 604.858 380.057 604.858ZM378.385 566.632C370.474 566.632 363.572 564.641 357.679 560.659C351.786 556.678 347.22 551.262 343.981 544.414C340.743 537.565 339.124 529.84 339.124 521.239C339.124 512.532 340.743 504.781 343.981 497.985C347.273 491.136 351.919 485.747 357.918 481.819C363.917 477.837 370.978 475.846 379.101 475.846C387.277 475.846 394.126 477.837 399.648 481.819C405.222 485.747 409.443 491.136 412.31 497.985C415.177 504.834 416.61 512.585 416.61 521.239C416.61 529.787 415.177 537.512 412.31 544.414C409.443 551.262 405.169 556.678 399.488 560.659C393.808 564.641 386.773 566.632 378.385 566.632ZM381.331 549.431C386.481 549.431 390.622 548.263 393.755 545.927C396.94 543.538 399.25 540.219 400.683 535.972C402.17 531.725 402.913 526.814 402.913 521.239C402.913 515.611 402.17 510.7 400.683 506.506C399.25 502.259 396.993 498.967 393.914 496.631C390.835 494.242 386.853 493.048 381.968 493.048C376.818 493.048 372.571 494.322 369.226 496.87C365.882 499.365 363.413 502.763 361.82 507.064C360.227 511.311 359.431 516.036 359.431 521.239C359.431 526.495 360.201 531.273 361.74 535.574C363.333 539.821 365.749 543.192 368.987 545.688C372.226 548.183 376.341 549.431 381.331 549.431ZM453.357 566.632C447.145 566.632 441.889 565.464 437.589 563.128C433.288 560.739 430.023 557.58 427.793 553.651C425.616 549.723 424.528 545.396 424.528 540.671C424.528 536.529 425.218 532.813 426.599 529.521C427.979 526.177 430.103 523.31 432.97 520.921C435.837 518.478 439.553 516.487 444.119 514.948C447.57 513.833 451.605 512.824 456.224 511.922C460.896 511.019 465.939 510.196 471.355 509.453C476.823 508.656 482.53 507.807 488.477 506.904L481.628 510.807C481.681 504.86 480.354 500.48 477.646 497.667C474.938 494.853 470.373 493.446 463.948 493.446C460.073 493.446 456.33 494.348 452.72 496.153C449.109 497.959 446.588 501.064 445.154 505.471L427.634 499.976C429.758 492.702 433.793 486.862 439.739 482.456C445.738 478.049 453.808 475.846 463.948 475.846C471.594 475.846 478.31 477.094 484.097 479.589C489.937 482.084 494.264 486.172 497.078 491.853C498.617 494.879 499.546 497.985 499.865 501.171C500.183 504.303 500.343 507.727 500.343 511.444V564.243H483.539V545.608L486.327 548.634C482.451 554.846 477.912 559.412 472.709 562.332C467.559 565.199 461.108 566.632 453.357 566.632ZM457.179 551.342C461.533 551.342 465.249 550.572 468.329 549.032C471.408 547.493 473.85 545.608 475.655 543.378C477.513 541.148 478.761 539.051 479.398 537.087C480.407 534.645 480.964 531.857 481.07 528.725C481.23 525.54 481.309 522.965 481.309 521L487.203 522.752C481.416 523.655 476.452 524.451 472.31 525.141C468.169 525.832 464.612 526.495 461.639 527.132C458.666 527.716 456.038 528.38 453.755 529.123C451.525 529.92 449.64 530.849 448.101 531.91C446.561 532.972 445.366 534.193 444.517 535.574C443.721 536.954 443.322 538.573 443.322 540.432C443.322 542.555 443.853 544.44 444.915 546.086C445.977 547.679 447.517 548.953 449.534 549.908C451.605 550.864 454.153 551.342 457.179 551.342ZM567.823 564.243V522.832C567.823 520.124 567.637 517.125 567.265 513.833C566.894 510.541 566.018 507.382 564.637 504.356C563.31 501.277 561.292 498.755 558.585 496.791C555.93 494.826 552.32 493.844 547.754 493.844C545.312 493.844 542.896 494.242 540.507 495.038C538.118 495.835 535.941 497.215 533.977 499.18C532.066 501.091 530.526 503.745 529.358 507.143C528.19 510.488 527.606 514.789 527.606 520.045L516.218 515.187C516.218 507.86 517.625 501.224 520.439 495.277C523.306 489.331 527.5 484.606 533.021 481.102C538.543 477.545 545.338 475.766 553.408 475.766C559.779 475.766 565.035 476.828 569.177 478.952C573.318 481.075 576.609 483.783 579.052 487.075C581.494 490.366 583.299 493.87 584.467 497.587C585.635 501.303 586.378 504.834 586.697 508.179C587.068 511.47 587.254 514.151 587.254 516.222V564.243H567.823ZM508.174 564.243V478.235H525.296V504.913H527.606V564.243H508.174ZM628.377 566.632C620.466 566.632 613.564 564.641 607.671 560.659C601.778 556.678 597.212 551.262 593.973 544.414C590.735 537.565 589.116 529.84 589.116 521.239C589.116 512.532 590.735 504.781 593.973 497.985C597.265 491.136 601.911 485.747 607.91 481.819C613.909 477.837 620.97 475.846 629.093 475.846C637.27 475.846 644.118 477.837 649.64 481.819C655.214 485.747 659.435 491.136 662.302 497.985C665.169 504.834 666.603 512.585 666.603 521.239C666.603 529.787 665.169 537.512 662.302 544.414C659.435 551.262 655.161 556.678 649.481 560.659C643.8 564.641 636.765 566.632 628.377 566.632ZM631.323 549.431C636.473 549.431 640.614 548.263 643.747 545.927C646.932 543.538 649.242 540.219 650.675 535.972C652.162 531.725 652.905 526.814 652.905 521.239C652.905 515.611 652.162 510.7 650.675 506.506C649.242 502.259 646.985 498.967 643.906 496.631C640.827 494.242 636.845 493.048 631.96 493.048C626.811 493.048 622.563 494.322 619.218 496.87C615.874 499.365 613.405 502.763 611.812 507.064C610.219 511.311 609.423 516.036 609.423 521.239C609.423 526.495 610.193 531.273 611.733 535.574C613.325 539.821 615.741 543.192 618.98 545.688C622.218 548.183 626.333 549.431 631.323 549.431ZM652.905 564.243V503.878H650.516V449.566H669.868V564.243H652.905ZM717.441 566.632C708.84 566.632 701.328 564.694 694.904 560.819C688.48 556.943 683.489 551.607 679.932 544.812C676.428 537.963 674.676 530.105 674.676 521.239C674.676 512.214 676.481 504.303 680.091 497.507C683.701 490.712 688.718 485.402 695.143 481.58C701.567 477.757 708.999 475.846 717.441 475.846C726.095 475.846 733.634 477.784 740.058 481.659C746.482 485.535 751.473 490.897 755.03 497.746C758.587 504.542 760.365 512.373 760.365 521.239C760.365 530.158 758.56 538.043 754.95 544.891C751.393 551.687 746.402 557.023 739.978 560.898C733.554 564.721 726.042 566.632 717.441 566.632ZM717.441 548.634C725.086 548.634 730.767 546.086 734.483 540.989C738.2 535.892 740.058 529.309 740.058 521.239C740.058 512.904 738.173 506.267 734.404 501.33C730.634 496.339 724.98 493.844 717.441 493.844C712.291 493.844 708.044 495.012 704.699 497.348C701.407 499.631 698.965 502.843 697.372 506.984C695.78 511.072 694.983 515.824 694.983 521.239C694.983 529.574 696.868 536.237 700.638 541.228C704.46 546.166 710.061 548.634 717.441 548.634ZM784.314 564.243V449.566H801.595L841.254 530.796L880.914 449.566H898.195V564.243H880.276V490.738L845.077 564.243H837.432L802.312 490.738V564.243H784.314ZM907.826 564.243V449.566H927.018V502.763L972.81 449.566H996.382L947.087 505.79L999.727 564.243H975.358L927.018 510.727V564.243H907.826ZM1025.76 564.243V467.564H988.651V449.566H1082.07V467.564H1044.95V564.243H1025.76Z"
        fill="#FE731B"
      />
      <path
        d="M365.667 356.453C420.323 318.867 498.567 365.986 530.858 394.243C515.358 267.595 533.917 78.6444 545.133 0C377.903 29.415 355.81 249.892 365.667 356.453Z"
        fill="#FE731B"
      />
      <path
        d="M556.35 394.243C643.364 375.859 766.203 284.345 561.448 65.3667C590.679 132.436 630.583 292.108 556.35 394.243Z"
        fill="#FE731B"
      />
    </svg>
  );
}

export function BriefingView() {
  const { clients, events, employees, updateClient, saveEvent, openNewEventModal, toast } = useAgenda();

  // Filtro de busca e status na tela de cards de compromissos
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendentes' | 'feitos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Compromisso selecionado ao clicar no card do restaurante
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [videoDrafts, setVideoDrafts] = useState<EditableVideoDraft[]>([]);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);

  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Todos os compromissos de gravação / foto dos restaurantes ordenados por data
  const recordingEvents = useMemo(() => {
    return [...events]
      .filter((ev) => ev.status !== 'cancelado')
      .sort((a, b) => {
        const cmp = a.data.localeCompare(b.data);
        if (cmp !== 0) return cmp;
        return a.hora_inicio.localeCompare(b.hora_inicio);
      });
  }, [events]);

  const counts = useMemo(() => {
    let feitos = 0;
    let pendentes = 0;
    for (const ev of recordingEvents) {
      if (hasBriefingDone(ev)) feitos++;
      else pendentes++;
    }
    return { total: recordingEvents.length, feitos, pendentes };
  }, [recordingEvents]);

  const filteredEvents = useMemo(() => {
    return recordingEvents.filter((ev) => {
      const done = hasBriefingDone(ev);
      if (statusFilter === 'pendentes' && done) return false;
      if (statusFilter === 'feitos' && !done) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const clientName = (ev.client?.nome || clients.find((c) => c.id === ev.client_id)?.nome || '').toLowerCase();
        const local = (ev.local || '').toLowerCase();
        const dateStr = fmtDate(ev.data).toLowerCase();
        return clientName.includes(q) || local.includes(q) || dateStr.includes(q);
      }
      return true;
    });
  }, [recordingEvents, statusFilter, searchQuery, clients]);

  const activeEvent = useMemo(
    () => recordingEvents.find((e) => e.id === activeEventId) || null,
    [recordingEvents, activeEventId]
  );

  const activeClient = useMemo(() => {
    if (!activeEvent) return null;
    return activeEvent.client || clients.find((c) => c.id === activeEvent.client_id) || null;
  }, [activeEvent, clients]);

  // Ao clicar no card de um compromisso de restaurante, abre o editor de vídeos
  const handleOpenEventBriefing = (ev: EventItem) => {
    setActiveEventId(ev.id);
    setVideoDrafts(draftsFromRaw(ev.briefing_gravacao));
    setStatusMsg('');
  };

  // Manipulação da lista de vídeos separados
  const handleAddAnotherVideo = () => {
    setVideoDrafts((prev) => [
      ...prev,
      {
        id: `video-${prev.length + 1}-${Date.now()}`,
        titulo: '',
        formato: 'Automático',
        roteiro: '',
        refRotulo: 'Referência',
        refUrl: '',
      },
    ]);
  };

  const handleUpdateVideoDraft = (id: string, patch: Partial<EditableVideoDraft>) => {
    setVideoDrafts((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const handleRemoveVideoDraft = (id: string) => {
    setVideoDrafts((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: `video-1-${Date.now()}`,
            titulo: '',
            formato: 'Automático',
            roteiro: '',
            refRotulo: 'Referência',
            refUrl: '',
          },
        ];
      }
      return prev.filter((v) => v.id !== id);
    });
  };

  //Texto bruto consolidado para o evento e para o PDF A4
  const serializedRawText = useMemo(() => serializeDraftsToRaw(videoDrafts), [videoDrafts]);
  const parsedPreviewItems = useMemo(() => parseItems(serializedRawText), [serializedRawText]);
  const formatsCount = useMemo(
    () => new Set(parsedPreviewItems.map((i) => inferCategory(i.text))).size,
    [parsedPreviewItems]
  );
  const pages = useMemo(() => {
    const list: BriefingVideoItem[][] = [];
    for (let i = 0; i < parsedPreviewItems.length; i += 4) {
      list.push(parsedPreviewItems.slice(i, i + 4));
    }
    if (list.length === 0) list.push([]);
    return list;
  }, [parsedPreviewItems]);

  const handleSaveBriefing = () => {
    if (!activeEvent) return;
    const raw = serializeDraftsToRaw(videoDrafts);

    saveEvent(
      {
        ...activeEvent,
        briefing_gravacao: raw || null,
      },
      true
    );

    if (activeClient && raw) {
      updateClient(activeClient.id, {
        briefing_roteiros_modelos: raw,
      });
    }

    const qtd = parseItems(raw).length;
    if (raw) {
      toast(`Briefing salvo com ${qtd} ${qtd === 1 ? 'vídeo' : 'vídeos'} para ${activeClient?.nome || 'Restaurante'}!`);
      setStatusMsg(`Salvo com sucesso (${qtd} ${qtd === 1 ? 'vídeo' : 'vídeos'}). Status: Briefing Feito.`);
    } else {
      toast('Briefing limpo (marcado como Pendente).', 'info');
      setStatusMsg('Briefing marcado como Pendente.');
    }
  };

  // Geração de PDF A4 para o compromisso aberto
  const gerarPdfBlob = useCallback(async (): Promise<Blob> => {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const container = previewContainerRef.current;
    if (!container) throw new Error('Ative a visualização A4 para gerar o PDF.');
    const paginas = Array.from(container.querySelectorAll<HTMLElement>('.briefing-a4-page'));
    if (!paginas.length) throw new Error('Nada para gerar.');

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas-pro'),
      import('jspdf'),
    ]);

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    });

    for (let i = 0; i < paginas.length; i++) {
      let links: Array<{ url: string; x: number; y: number; w: number; h: number }> = [];
      const canvas = await html2canvas(paginas[i], {
        scale: 2,
        backgroundColor: '#0A0705',
        useCORS: true,
        logging: false,
        onclone: (_doc, el) => {
          el.style.transform = 'none';
          const base = el.getBoundingClientRect();
          links = Array.from(el.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')).flatMap(
            (a) =>
              Array.from(a.getClientRects()).map((r) => ({
                url: a.href,
                x: (r.left - base.left) / base.width,
                y: (r.top - base.top) / base.height,
                w: r.width / base.width,
                h: r.height / base.height,
              }))
          );
        },
      });
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      links.forEach((l) => {
        pdf.link(l.x * 210, l.y * 297, l.w * 210, l.h * 297, { url: l.url });
      });
    }

    return pdf.output('blob');
  }, []);

  const baixarBlob = (blob: Blob, nome: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleDownloadOrSharePdf = async (mode: 'download' | 'share') => {
    if (!showPdfPreview) {
      setShowPdfPreview(true);
      await new Promise((r) => setTimeout(r, 250));
    }
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setStatusMsg('Gerando PDF A4...');
    try {
      const blob = await gerarPdfBlob();
      const cleanName = (activeClient?.nome || 'Restaurante').replace(/[\/\\:*?"<>|]/g, '-');
      const fileName = `Briefing - ${cleanName} - ${activeEvent?.data || ''}.pdf`;

      if (mode === 'share') {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
          setStatusMsg('PDF compartilhado!');
          return;
        }
      }
      baixarBlob(blob, fileName);
      setStatusMsg('PDF baixado com sucesso!');
    } catch (e) {
      setStatusMsg('Erro ao gerar PDF: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ============================================================================
  // VISÃO 1: GRADE DE CARDS DOS COMPROMISSOS DOS RESTAURANTES (PENDENTE / FEITO)
  // ============================================================================
  if (!activeEvent) {
    return (
      <div className="space-y-6">
        {/* Cabeçalho e Resumo */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[var(--ui-accent)] mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Central de Briefings por Compromisso</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Gravações dos Restaurantes
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Clique no card de um restaurante agendado para abrir a área de escrita e separar os briefings de cada vídeo.
            </p>
          </div>

          {/* Indicadores Rápidos */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-[var(--ui-page)] border border-[var(--ui-border)] flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-400">Compromissos</div>
                <div className="text-sm font-extrabold text-foreground">{counts.total}</div>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-300/80">Pendentes</div>
                <div className="text-sm font-extrabold text-amber-400">{counts.pendentes}</div>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-300/80">Briefing Feito</div>
                <div className="text-sm font-extrabold text-emerald-400">{counts.feitos}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openNewEventModal()}
              className="px-3.5 py-2.5 rounded-xl gradient-cta text-foreground font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Gravação</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] self-start">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'todos'
                  ? 'bg-[var(--ui-accent)] text-white shadow'
                  : 'text-zinc-400 hover:text-foreground'
              }`}
            >
              Todos ({counts.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pendentes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'pendentes'
                  ? 'bg-amber-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-amber-300'
              }`}
            >
              Pendentes ({counts.pendentes})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('feitos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'feitos'
                  ? 'bg-emerald-500 text-zinc-950 shadow'
                  : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              Feitos ({counts.feitos})
            </button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar restaurante, data ou local..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
            />
          </div>
        </div>

        {/* Grid de Cards dos Compromissos dos Restaurantes */}
        {filteredEvents.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] text-center space-y-3">
            <Building className="w-10 h-10 text-zinc-500 mx-auto" />
            <div className="text-sm font-bold text-foreground">
              Nenhum compromisso encontrado para este filtro
            </div>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Agende uma gravação na agenda ou altere o filtro acima para visualizar os restaurantes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEvents.map((ev) => {
              const client = ev.client || clients.find((c) => c.id === ev.client_id);
              const done = hasBriefingDone(ev);
              const videoCount = countBriefingVideos(ev);
              const assignedMembers = (ev.assigned_employee_ids || [])
                .map((id) => employees.find((emp) => emp.id === id))
                .filter(Boolean);
              const parsedPreview = done && ev.briefing_gravacao ? parseItems(ev.briefing_gravacao) : [];

              return (
                <div
                  key={ev.id}
                  onClick={() => handleOpenEventBriefing(ev)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenEventBriefing(ev);
                    }
                  }}
                  className={`group rounded-2xl p-5 bg-[var(--ui-surface)] border transition-all cursor-pointer flex flex-col justify-between gap-4 hover:-translate-y-0.5 shadow-lg ${
                    done
                      ? 'border-emerald-500/35 hover:border-emerald-400/70'
                      : 'border-amber-500/35 hover:border-[var(--ui-accent)]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Topo do Card: Nome do Restaurante + Status (Pendente ou Feito) */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[var(--ui-accent)] mb-0.5">
                          {EVENT_TYPE_LABELS[ev.tipo] || 'Gravação'}
                        </span>
                        <h3 className="text-base font-extrabold text-foreground truncate group-hover:text-[var(--ui-accent)] transition-colors">
                          {client?.nome || 'Restaurante'}
                        </h3>
                      </div>

                      {done ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Feito ({videoCount} {videoCount === 1 ? 'vídeo' : 'vídeos'})</span>
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pendente</span>
                        </span>
                      )}
                    </div>

                    {/* Data e Horário do Compromisso */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 bg-[var(--ui-page)] px-3 py-2 rounded-xl border border-[var(--ui-border)]">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
                        {fmtDate(ev.data)}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {ev.hora_inicio.slice(0, 5)} às {ev.hora_fim.slice(0, 5)}
                      </span>
                    </div>

                    {/* Resumo dos Vídeos ou Chamada para Preencher */}
                    {done && parsedPreview.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Vídeos planejados:
                        </div>
                        {parsedPreview.slice(0, 2).map((vid) => (
                          <div
                            key={vid.n}
                            className="text-xs text-zinc-300 line-clamp-1 bg-white/[0.02] px-2.5 py-1.5 rounded-lg border border-white/5"
                          >
                            <strong className="text-[var(--ui-accent)] mr-1.5">Vídeo {vid.n}:</strong>
                            {vid.text}
                          </div>
                        ))}
                        {parsedPreview.length > 2 && (
                          <div className="text-[11px] text-zinc-400 font-medium pl-1">
                            + {parsedPreview.length - 2} outro(s) vídeo(s)...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-xs text-amber-200/90 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Nenhum briefing escrito ainda. Clique para criar os vídeos desta gravação.</span>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Card: Equipe + Botão de Abrir */}
                  <div className="pt-3 border-t border-[var(--ui-border)] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      {assignedMembers.length > 0 ? (
                        assignedMembers.slice(0, 3).map((emp) =>
                          emp ? <EmployeeBadge key={emp.id} employee={emp} size="sm" /> : null
                        )
                      ) : (
                        <span className="text-[11px] text-zinc-400">Sem equipe definida</span>
                      )}
                      {assignedMembers.length > 3 && (
                        <span className="text-[10px] text-zinc-400 font-bold">
                          +{assignedMembers.length - 3}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--ui-accent)] group-hover:translate-x-0.5 transition-transform">
                      <span>{done ? 'Editar Vídeos' : 'Escrever Briefing'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // VISÃO 2: EDITOR DE BRIEFINGS SEPARADOS POR VÍDEO DO RESTAURANTE SELECIONADO
  // ============================================================================
  const displayClient = activeClient?.nome || 'Restaurante';
  const displayDate = fmtDate(activeEvent.data);
  const isCurrentlyDone = hasBriefingDone(activeEvent);

  return (
    <div className="space-y-6">
      {/* Barra Superior do Compromisso Selecionado */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <button
            type="button"
            onClick={() => setActiveEventId(null)}
            className="p-2.5 rounded-xl bg-[var(--ui-page)] hover:bg-[var(--ui-raised)] border border-[var(--ui-border)] text-zinc-300 hover:text-foreground transition-colors cursor-pointer shrink-0"
            title="Voltar para a lista de restaurantes"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--ui-accent)]/15 text-[var(--ui-accent)]">
                {EVENT_TYPE_LABELS[activeEvent.tipo] || 'Gravação'}
              </span>
              <span className="text-xs text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
                {displayDate} ({activeEvent.hora_inicio.slice(0, 5)} às {activeEvent.hora_fim.slice(0, 5)})
              </span>
              {isCurrentlyDone ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Briefing Feito
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Clock className="w-3 h-3" />
                  Briefing Pendente
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {displayClient}
            </h2>
          </div>
        </div>

        {/* Ações Principais do Briefing */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPdfPreview((v) => !v)}
            className="px-3.5 py-2.5 rounded-xl bg-[var(--ui-page)] hover:bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[var(--ui-accent)]" />
            <span>{showPdfPreview ? 'Ocultar Folha A4' : 'Ver Folha A4'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadOrSharePdf('download')}
            disabled={isGeneratingPdf || parsedPreviewItems.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-[var(--ui-page)] hover:bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[var(--ui-accent)]" />
            <span>Baixar PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadOrSharePdf('share')}
            disabled={isGeneratingPdf || parsedPreviewItems.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-[var(--ui-page)] hover:bg-[var(--ui-raised)] border border-[var(--ui-border)] text-xs font-bold text-zinc-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Share2 className="w-4 h-4 text-[var(--ui-accent)]" />
            <span>Compartilhar</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBriefing}
            className="px-5 py-2.5 rounded-xl gradient-cta text-white font-extrabold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Briefing ({videoDrafts.length} {videoDrafts.length === 1 ? 'Vídeo' : 'Vídeos'})</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Lista de Cards de Vídeo Separados */}
      <div className="space-y-4">
        {videoDrafts.map((video, index) => {
          const detectedCategory =
            video.formato !== 'Automático'
              ? video.formato
              : video.roteiro.trim()
                ? inferCategory(video.roteiro)
                : 'Conteúdo';

          return (
            <div
              key={video.id}
              className="p-5 sm:p-6 rounded-2xl bg-[var(--ui-surface)] border border-[var(--ui-border)] space-y-4 shadow-md"
            >
              {/* Cabeçalho do Vídeo */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--ui-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--ui-accent)]/15 border border-[var(--ui-accent)]/40 text-[var(--ui-accent)] font-extrabold text-sm flex items-center justify-center">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <Video className="w-4 h-4 text-[var(--ui-accent)]" />
                      <span>Briefing do Vídeo {index + 1}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Formato identificado: <strong className="text-[var(--ui-accent)]">{detectedCategory}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={video.formato}
                    onChange={(e) => handleUpdateVideoDraft(video.id, { formato: e.target.value })}
                    className="px-3 py-1.5 rounded-xl bg-[var(--ui-page)] border border-[var(--ui-border)] text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                    title="Formato do vídeo"
                  >
                    {VIDEO_FORMATS.map((fmt) => (
                      <option key={fmt} value={fmt}>
                        Formato: {fmt}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveVideoDraft(video.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Remover este vídeo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Campos do Vídeo */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Título / Ideia Principal do Vídeo {index + 1} (Opcional)
                  </label>
                  <input
                    type="text"
                    value={video.titulo}
                    onChange={(e) => handleUpdateVideoDraft(video.id, { titulo: e.target.value })}
                    placeholder={`Ex: Produção ASMR da Linha Oriental, Desafio com Cliente, Prato Carro-Chefe...`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--ui-page)] border border-[var(--ui-border)] text-xs sm:text-sm text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ui-accent)] mb-1.5">
                    Roteiro / Cenas / Falas do Vídeo {index + 1} *
                  </label>
                  <textarea
                    rows={4}
                    value={video.roteiro}
                    onChange={(e) => handleUpdateVideoDraft(video.id, { roteiro: e.target.value })}
                    placeholder={`Descreva exatamente como deve ser gravado o Vídeo ${index + 1} (gancho inicial, takes de cozinha, falas, transição)...`}
                    className="w-full p-3.5 rounded-xl bg-[var(--ui-page)] border border-[var(--ui-border)] text-xs sm:text-sm text-foreground leading-relaxed focus:outline-none focus:border-[var(--ui-accent)] resize-y"
                  />
                </div>

                {/* Link de Referência / Exemplo */}
                <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2.5 items-center">
                  <select
                    value={video.refRotulo}
                    onChange={(e) =>
                      handleUpdateVideoDraft(video.id, {
                        refRotulo: e.target.value as 'Referência' | 'Exemplo',
                      })
                    }
                    className="px-3 py-2.5 rounded-xl bg-[var(--ui-page)] border border-[var(--ui-border)] text-xs font-semibold text-zinc-300 focus:outline-none focus:border-[var(--ui-accent)]"
                  >
                    <option value="Referência">Link de Referência</option>
                    <option value="Exemplo">Link de Exemplo</option>
                  </select>

                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="url"
                      value={video.refUrl}
                      onChange={(e) => handleUpdateVideoDraft(video.id, { refUrl: e.target.value })}
                      placeholder="https://instagram.com/reel/... ou TikTok de referência (opcional)"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[var(--ui-page)] border border-[var(--ui-border)] text-xs text-foreground focus:outline-none focus:border-[var(--ui-accent)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Botão Intuitivo e Destacado para Fazer Briefing do Próximo Vídeo */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleAddAnotherVideo}
            className="flex-1 py-4 px-5 rounded-2xl border-2 border-dashed border-[var(--ui-accent)]/50 hover:border-[var(--ui-accent)] bg-[var(--ui-accent)]/10 hover:bg-[var(--ui-accent)]/15 text-[var(--ui-accent)] font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Fazer Briefing de Outro Vídeo (+ Adicionar Vídeo {videoDrafts.length + 1})</span>
          </button>

          <button
            type="button"
            onClick={handleSaveBriefing}
            className="py-4 px-7 rounded-2xl gradient-cta text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todos os Vídeos</span>
          </button>
        </div>
      </div>

      {/* Pré-visualização Folha A4 (Opcional / Sob Demanda) */}
      {showPdfPreview && (
        <div className="p-4 sm:p-8 rounded-3xl overflow-x-auto bg-[#15100d] border border-[rgba(255,116,31,0.25)] flex justify-center">
          <div
            ref={previewContainerRef}
            className="flex flex-col gap-7 items-center"
            style={{ fontFamily: 'var(--font-body), "Instrument Sans", sans-serif' }}
          >
            {pages.map((chunk, idx) => (
              <section
                key={idx}
                className="briefing-a4-page relative overflow-hidden shrink-0"
                style={{
                  width: 794,
                  height: 1123,
                  background: '#0A0705',
                  color: '#F6F0EA',
                  padding: '40px 44px 36px',
                  boxShadow: '0 20px 70px rgba(0,0,0,.4)',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    height: 48,
                  }}
                >
                  <NavegandoBrandLogo />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      fontSize: '11.5px',
                      letterSpacing: '0.24em',
                      textTransform: 'uppercase',
                      color: 'rgba(246,240,234,0.72)',
                      paddingTop: 7,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>Cliente • {displayClient}</span>
                    <span
                      style={{
                        width: 1,
                        height: 16,
                        background: '#FF741F',
                        opacity: 0.7,
                      }}
                    />
                    <span>{displayDate}</span>
                  </div>
                </div>

                {idx === 0 ? (
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      paddingTop: 14,
                      paddingBottom: 12,
                      borderBottom: '1px solid rgba(255,116,31,0.30)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          color: '#FF741F',
                          fontWeight: 600,
                          marginBottom: 8,
                        }}
                      >
                        Briefing criativo
                      </div>
                      <h2
                        style={{
                          fontFamily: 'var(--font-title), "Bricolage Grotesque", sans-serif',
                          fontSize: 52,
                          lineHeight: 0.92,
                          letterSpacing: '-0.04em',
                          fontWeight: 700,
                          margin: 0,
                          maxWidth: 540,
                          color: '#F6F0EA',
                        }}
                      >
                        Roteiro de vídeos
                        <span style={{ color: '#FF741F', display: 'block' }}>{displayClient}.</span>
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: 34, paddingBottom: 4 }}>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-title), "Bricolage Grotesque", sans-serif',
                            color: '#FF741F',
                            fontSize: 56,
                            lineHeight: 0.9,
                            fontWeight: 700,
                          }}
                        >
                          {parsedPreviewItems.length}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: 'rgba(246,240,234,0.76)',
                            marginTop: 8,
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                          }}
                        >
                          vídeos
                        </div>
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-title), "Bricolage Grotesque", sans-serif',
                            color: '#FF741F',
                            fontSize: 56,
                            lineHeight: 0.9,
                            fontWeight: 700,
                          }}
                        >
                          {formatsCount}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: 'rgba(246,240,234,0.76)',
                            marginTop: 8,
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                          }}
                        >
                          formatos
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gridTemplateRows: '1fr 1fr',
                    gap: 12,
                    marginTop: 14,
                    height: 830,
                  }}
                >
                  {chunk.map((item) => {
                    const cat = inferCategory(item.text);
                    const sub = inferSub(item.text);
                    const bodyParts = parseBodyWithLinks(item.text);

                    return (
                      <article
                        key={item.n}
                        style={{
                          border: '1px solid rgba(255,116,31,0.42)',
                          background: 'rgba(255,116,31,0.045)',
                          borderRadius: 16,
                          padding: 20,
                          minHeight: 0,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                          <div
                            style={{
                              fontFamily: 'var(--font-title), "Bricolage Grotesque", sans-serif',
                              fontSize: 48,
                              lineHeight: 0.88,
                              color: '#FF741F',
                              fontWeight: 600,
                            }}
                          >
                            {String(item.n).padStart(2, '0')}
                          </div>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                border: '1px solid rgba(255,116,31,0.45)',
                                borderRadius: 999,
                                padding: '4px 10px',
                                fontSize: 12,
                                color: '#F6F0EA',
                              }}
                            >
                              {cat}
                            </span>
                            <div
                              style={{
                                fontSize: 12,
                                color: 'rgba(246,240,234,0.55)',
                                marginTop: 6,
                              }}
                            >
                              {sub}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: '16px',
                            lineHeight: 1.45,
                            color: '#F6F0EA',
                            marginTop: 12,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {bodyParts.map((part, pIdx) =>
                            part.type === 'link' ? (
                              <a
                                key={pIdx}
                                href={part.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#FF741F', fontSize: 13 }}
                              >
                                {part.display}
                              </a>
                            ) : (
                              <React.Fragment key={pIdx}>{part.value}</React.Fragment>
                            )
                          )}
                        </div>

                        {item.refs.map((r, rIdx) => (
                          <div key={rIdx} style={{ marginTop: 10 }}>
                            <div
                              style={{
                                fontSize: '10.5px',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: 'rgba(246,240,234,0.55)',
                              }}
                            >
                              {r.rotulo}
                            </div>
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#FF741F', fontSize: 13, wordBreak: 'break-all' }}
                            >
                              {exibirUrl(r.url)}
                            </a>
                          </div>
                        ))}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
