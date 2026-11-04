'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAgenda } from '@/context/AgendaContext';
import { Share2, Download, Sparkles, CheckCircle2, Building, Calendar } from 'lucide-react';

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

const DEFAULT_RAW_BRIEFING = `1 - Fazer vídeo totalmente ASMR produzindo embalagem de sushi (para divulgar a linha oriental)

2 - Fazer vídeo apresentando o que é a linha oriental e mostrando as principais embalagens da linha, enquanto passam takes da produção das embalagens!

3 - Fazer vídeo com música em alta personalizando embalagens da linha de pastel e mostrando produção das embalagens!

4 - Fazer vídeo apresentando o que é a linha de pastel e mostrando todos os tipos de embalagem da linha, enquanto passam takes da produção delas e da personalização!

5 - Fazer vídeo POV: Um dia de produção da fábrica da 24print! Mostrar takes do pessoal produzindo embalagens, personalizando, fazendo impressões!
Referência: https://instagram.com/reel/DaTn3wXhPO6

6 - Fazer vídeo "Cliente: Minha hamburgueria não tem embalagens para os hambúrgueres!" "24print: Não diga mais nada que nós resolvemos" takes saindo várias embalagens de hambúrguer das máquinas!
Referência: https://instagram.com/reel/DZFf-U7hLD2

7 - Fazer vídeo com óculos meta apresentando a 24print e falando tudo que eles produzem e fazem de diferencial, mostrar takes das 3 fábricas e das máquinas trabalhando explicando o que elas fazem, mostrar estoque e falar que tudo é feito para envio imediato!

8 - Fazer vídeo chegando em um moço que está trabalhando na máquina e perguntar "Tá fazendo o que nessa máquina?" Ele responder "É nessa máquina que eu faço todas essas embalagens para hamburgueria, pastelaria, restaurante japonês, quer ver como eu faço?" Passar takes de todas essas embalagens e mostrar ele preparando uma de cada!`;

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
      // Se a pessoa pulou linha antes de "Referência: https://...", anexa ao vídeo anterior
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
  const { clients, events, updateClient, saveEvent, toast, canManage } = useAgenda();

  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('24 Print');
  const [briefingDate, setBriefingDate] = useState<string>(todayIso);
  const [rawText, setRawText] = useState<string>(DEFAULT_RAW_BRIEFING);

  // Estado que alimenta a pré-visualização A4
  const [renderedState, setRenderedState] = useState<{
    client: string;
    date: string;
    raw: string;
  }>({
    client: '24 Print',
    date: todayIso,
    raw: DEFAULT_RAW_BRIEFING,
  });

  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const cachedPdfRef = useRef<{ key: string; blob: Blob } | null>(null);
  const prepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPreparingRef = useRef<boolean>(false);

  // Gravações vinculadas ao restaurante selecionado
  const clientEvents = useMemo(() => {
    if (!selectedClientId) return [];
    return events
      .filter((e) => e.client_id === selectedClientId)
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [events, selectedClientId]);

  const handleSelectCrmClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedEventId('');
    if (!clientId) return;
    const found = clients.find((c) => c.id === clientId);
    if (!found) return;
    setClientName(found.nome);

    // Próxima gravação do restaurante na agenda
    const nextEvt = events
      .filter((e) => e.client_id === found.id)
      .sort((a, b) => a.data.localeCompare(b.data))[0];

    const nextDate = nextEvt?.data || briefingDate;
    if (nextEvt) {
      setSelectedEventId(nextEvt.id);
      setBriefingDate(nextEvt.data);
    }

    const savedScript =
      nextEvt?.briefing_gravacao?.trim() ||
      found.briefing_roteiros_modelos?.trim() ||
      found.briefing?.trim();

    if (savedScript) {
      setRawText(savedScript);
      setRenderedState({
        client: found.nome,
        date: nextDate,
        raw: savedScript,
      });
    } else {
      setRenderedState((prev) => ({
        ...prev,
        client: found.nome,
        date: nextDate,
      }));
    }
  };

  const handleSelectCrmEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    const evt = events.find((e) => e.id === eventId);
    if (!evt) return;
    setBriefingDate(evt.data);
    if (evt.briefing_gravacao?.trim()) {
      setRawText(evt.briefing_gravacao);
      setRenderedState({
        client: clientName.trim() || 'Cliente',
        date: evt.data,
        raw: evt.briefing_gravacao,
      });
    } else {
      setRenderedState((prev) => ({
        ...prev,
        date: evt.data,
      }));
    }
  };

  // Cálculo dos vídeos e páginas A4 (4 vídeos por folha A4)
  const items = useMemo(() => parseItems(renderedState.raw), [renderedState.raw]);
  const formatsCount = useMemo(
    () => new Set(items.map((i) => inferCategory(i.text))).size,
    [items]
  );
  const pages = useMemo(() => {
    const list: BriefingVideoItem[][] = [];
    for (let i = 0; i < items.length; i += 4) {
      list.push(items.slice(i, i + 4));
    }
    if (list.length === 0) list.push([]);
    return list;
  }, [items]);

  const currentKey = useCallback(
    () => JSON.stringify([clientName.trim() || 'Cliente', briefingDate, rawText]),
    [clientName, briefingDate, rawText]
  );

  const nomeArquivo = useCallback(() => {
    const clean = (clientName.trim() || 'Cliente').replace(/[\/\\:*?"<>|]/g, '-');
    return `Briefing - ${clean}.pdf`;
  }, [clientName]);

  // Monta o PDF A4 com páginas de 210x297mm e anotações de links clicáveis
  const gerarPdfBlob = useCallback(async (): Promise<Blob> => {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    const container = previewContainerRef.current;
    if (!container) throw new Error('Visualização não encontrada.');
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

  // Sincroniza em tempo real a pré-visualização e pré-gera o PDF em background (para o iOS aceitar navigator.share no toque)
  useEffect(() => {
    setRenderedState({
      client: clientName.trim() || 'Cliente',
      date: briefingDate,
      raw: rawText,
    });

    if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    cachedPdfRef.current = null;
    setStatusMsg('');

    prepTimerRef.current = setTimeout(async () => {
      if (isPreparingRef.current) return;
      const k = JSON.stringify([clientName.trim() || 'Cliente', briefingDate, rawText]);
      isPreparingRef.current = true;
      setStatusMsg('Preparando PDF...');
      try {
        const blob = await gerarPdfBlob();
        cachedPdfRef.current = { key: k, blob };
        setStatusMsg('PDF pronto para compartilhar.');
      } catch (err) {
        cachedPdfRef.current = null;
        setStatusMsg(
          'Falha ao preparar o PDF: ' + (err instanceof Error ? err.message : String(err))
        );
      } finally {
        isPreparingRef.current = false;
      }
    }, 900);

    return () => {
      if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    };
  }, [clientName, briefingDate, rawText, gerarPdfBlob]);

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

  // Botão "Gerar briefing": atualiza o A4 imediatamente e salva no restaurante/gravação do CRM se vinculado
  const handleGenerateBriefing = () => {
    const cleanClient = clientName.trim() || 'Cliente';
    setRenderedState({
      client: cleanClient,
      date: briefingDate,
      raw: rawText,
    });

    if (canManage) {
      const matchedClient =
        clients.find((c) => c.id === selectedClientId) ||
        clients.find((c) => c.nome.toLowerCase() === cleanClient.toLowerCase());

      if (matchedClient) {
        updateClient(matchedClient.id, {
          briefing_roteiros_modelos: rawText.trim(),
        });
      }
      if (selectedEventId) {
        const targetEvt = events.find((e) => e.id === selectedEventId);
        if (targetEvt) {
          saveEvent({
            ...targetEvt,
            briefing_gravacao: rawText.trim(),
          }, true);
        }
      }
      if (matchedClient || selectedEventId) {
        toast(`Briefing de ${cleanClient} gerado e salvo na agenda!`);
        return;
      }
    }
    toast(`Briefing de ${cleanClient} atualizado!`);
  };

  // Botão "Compartilhar PDF": usa o PDF em cache para abrir o folha nativa de compartilhamento (WhatsApp no celular) sem precisar baixar
  const handleSharePdf = () => {
    const nome = nomeArquivo();
    const k = currentKey();

    const concluirShare = (p: Promise<void>, blob: Blob) => {
      p.then(() => setStatusMsg('Compartilhado.'))
        .catch((err) => {
          if (err && err.name === 'AbortError') {
            setStatusMsg('');
          } else {
            baixarBlob(blob, nome);
            setStatusMsg('Compartilhamento indisponível - PDF salvo nos downloads.');
          }
        });
    };

    if (cachedPdfRef.current && cachedPdfRef.current.key === k) {
      const blob = cachedPdfRef.current.blob;
      const file = new File([blob], nome, { type: 'application/pdf' });
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        concluirShare(navigator.share({ files: [file], title: nome }), blob);
      } else {
        baixarBlob(blob, nome);
        setStatusMsg('PDF salvo nos downloads.');
      }
      return;
    }

    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setStatusMsg('Gerando...');

    (async () => {
      try {
        const blob = await gerarPdfBlob();
        cachedPdfRef.current = { key: k, blob };
        const file = new File([blob], nome, { type: 'application/pdf' });
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          concluirShare(navigator.share({ files: [file], title: nome }), blob);
        } else {
          baixarBlob(blob, nome);
          setStatusMsg('PDF salvo nos downloads.');
        }
      } catch (e) {
        setStatusMsg('Falha ao gerar o PDF: ' + (e instanceof Error ? e.message : String(e)));
      } finally {
        setIsGeneratingPdf(false);
      }
    })();
  };

  const handleDownloadPdf = async () => {
    const nome = nomeArquivo();
    const k = currentKey();
    if (cachedPdfRef.current && cachedPdfRef.current.key === k) {
      baixarBlob(cachedPdfRef.current.blob, nome);
      setStatusMsg('PDF salvo nos downloads.');
      return;
    }
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setStatusMsg('Gerando PDF para download...');
    try {
      const blob = await gerarPdfBlob();
      cachedPdfRef.current = { key: k, blob };
      baixarBlob(blob, nome);
      setStatusMsg('PDF salvo nos downloads.');
    } catch (e) {
      setStatusMsg('Falha ao gerar o PDF: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const displayClient = renderedState.client.trim() || 'Cliente';
  const displayDate = fmtDate(renderedState.date);

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-[rgba(255,116,31,0.22)] bg-[#15100d] text-[#F6F0EA] shadow-2xl">
      <div className="grid grid-cols-1 xl:grid-cols-[390px_minmax(0,1fr)] min-h-[calc(100vh-7rem)]">
        {/* PAINEL LATERAL DE CONTROLES (IDÊNTICO AO NAVEGANDOMKT.COM.BR/BRIEFINGS + INTEGRAÇÃO CRM) */}
        <aside className="p-6 sm:p-7 bg-[#0d0a08] border-b xl:border-b-0 xl:border-r border-white/10 flex flex-col">
          <h1
            className="text-[28px] leading-none font-bold m-0 mb-2 text-[#F6F0EA]"
            style={{ fontFamily: 'var(--font-title), "Bricolage Grotesque", sans-serif' }}
          >
            Briefing Criativo
          </h1>
          <p className="text-[14px] leading-[1.45] text-[rgba(246,240,234,0.76)] m-0 mb-5">
            Cole o conteúdo, ajuste cliente e data e gere o PDF no padrão Navegando MKT.
          </p>

          {/* Atalho opcional para puxar restaurante e gravação direto da Agenda do CRM */}
          {clients.length > 0 && (
            <div className="mb-3 p-3 rounded-xl bg-[#120e0b] border border-[rgba(255,116,31,0.22)] space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#FF741F]">
                <Building className="w-3.5 h-3.5" />
                <span>Puxar Restaurante da Agenda (Opcional)</span>
              </div>
              <select
                value={selectedClientId}
                onChange={(e) => handleSelectCrmClient(e.target.value)}
                className="w-full rounded-lg bg-[#0d0a08] border border-[rgba(255,116,31,0.28)] px-2.5 py-2 text-xs text-[#F6F0EA] focus:outline-none focus:border-[#FF741F]"
              >
                <option value="">-- Digitar nome manualmente abaixo --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>

              {clientEvents.length > 0 && (
                <div className="pt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[rgba(246,240,234,0.65)] mb-1">
                    <Calendar className="w-3 h-3 text-[#FF741F]" />
                    <span>Vincular à Gravação da Agenda:</span>
                  </div>
                  <select
                    value={selectedEventId}
                    onChange={(e) => handleSelectCrmEvent(e.target.value)}
                    className="w-full rounded-lg bg-[#0d0a08] border border-[rgba(255,116,31,0.28)] px-2.5 py-1.5 text-xs text-[#F6F0EA] focus:outline-none focus:border-[#FF741F]"
                  >
                    <option value="">Selecionar data de gravação...</option>
                    {clientEvents.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {fmtDate(ev.data)} ({ev.hora_inicio} às {ev.hora_fim})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <label className="block text-[11px] uppercase tracking-[0.18em] text-[#FF741F] mt-3 mb-2 font-semibold">
            Cliente
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ex: 24 Print"
            className="w-full border border-[rgba(255,116,31,0.28)] focus:border-[rgba(255,116,31,0.7)] rounded-xl bg-[#120e0b] text-[#F6F0EA] px-3.5 py-3 text-sm outline-none transition-colors"
          />

          <label className="block text-[11px] uppercase tracking-[0.18em] text-[#FF741F] mt-4 mb-2 font-semibold">
            Data
          </label>
          <input
            type="date"
            value={briefingDate}
            onChange={(e) => setBriefingDate(e.target.value)}
            className="w-full border border-[rgba(255,116,31,0.28)] focus:border-[rgba(255,116,31,0.7)] rounded-xl bg-[#120e0b] text-[#F6F0EA] px-3.5 py-3 text-sm outline-none transition-colors"
          />

          <div className="flex items-center justify-between mt-4 mb-2">
            <label className="block text-[11px] uppercase tracking-[0.18em] text-[#FF741F] font-semibold">
              Conteúdo dos vídeos
            </label>
            <span className="text-[11px] text-[rgba(246,240,234,0.58)]">
              {items.length} {items.length === 1 ? 'vídeo' : 'vídeos'} • {formatsCount}{' '}
              {formatsCount === 1 ? 'formato' : 'formatos'}
            </span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Separe cada vídeo com uma linha em branco ou numere (1 -, 2 -).\n\nUse "Referência: https://..." ou "Exemplo: https://..." para anexar links clicáveis.`}
            className="w-full min-h-[320px] resize-y leading-[1.45] border border-[rgba(255,116,31,0.28)] focus:border-[rgba(255,116,31,0.7)] rounded-xl bg-[#120e0b] text-[#F6F0EA] p-3.5 text-sm outline-none transition-colors"
          />

          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <button
              type="button"
              onClick={handleGenerateBriefing}
              className="border-0 rounded-xl py-3.5 px-3.5 font-semibold text-sm bg-[#FF741F] hover:bg-[#ff853a] text-[#120903] cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar briefing</span>
            </button>
            <button
              type="button"
              onClick={handleSharePdf}
              disabled={isGeneratingPdf}
              className="rounded-xl py-3.5 px-3.5 font-semibold text-sm bg-transparent hover:bg-[rgba(255,116,31,0.1)] border border-[rgba(255,116,31,0.4)] text-[#F6F0EA] cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Share2 className="w-4 h-4 text-[#FF741F]" />
              <span>{isGeneratingPdf ? 'Gerando...' : 'Compartilhar PDF'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="mt-2.5 w-full rounded-xl py-2.5 px-3.5 font-semibold text-xs bg-[#120e0b] hover:bg-[rgba(255,116,31,0.12)] border border-[rgba(255,116,31,0.25)] text-[rgba(246,240,234,0.85)] cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#FF741F]" />
            <span>Baixar PDF no dispositivo ({nomeArquivo()})</span>
          </button>

          {statusMsg && (
            <div
              className="text-xs text-[#FF741F] mt-3 leading-[1.45] flex items-center gap-1.5 font-medium"
              aria-live="polite"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="text-xs text-[rgba(246,240,234,0.58)] mt-3 leading-[1.45] space-y-1.5">
            <p className="m-0">
              A categoria de cada vídeo (<strong>POV</strong>, <strong>Situação</strong>,{' '}
              <strong>ASMR</strong>, <strong>Foodporn</strong>, <strong>Entrevista</strong>,{' '}
              <strong>Trend</strong>, <strong>Tutorial</strong>, <strong>Preparo</strong>,{' '}
              <strong>Falado</strong>) é inferida automaticamente.
            </p>
            <p className="m-0">
              • Separe 2 linhas com um espaço em branco (ou use <code>1 -</code>, <code>2 -</code>)
              para trocar de vídeo.
            </p>
            <p className="m-0">
              • Use <code>Referência:</code> ou <code>Exemplo:</code> antes de um link para destacar
              como referência clicável no PDF.
            </p>
            <p className="m-0">
              • <strong>&ldquo;Compartilhar PDF&rdquo;</strong> monta o A4 aqui mesmo e abre o
              compartilhamento direto para o WhatsApp no celular — sem precisar baixar.
            </p>
          </div>
        </aside>

        {/* PREVIEW DAS PÁGINAS A4 (794x1123px EXATOS) */}
        <main className="p-4 sm:p-8 overflow-x-auto bg-[#15100d] flex justify-center">
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
                {/* Brilho radial laranja idêntico ao original */}
                <div
                  style={{
                    position: 'absolute',
                    width: 460,
                    height: 460,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(255,116,31,0.20) 0%, rgba(255,116,31,0.11) 42%, rgba(255,116,31,0) 72%)',
                    pointerEvents: 'none',
                    zIndex: 0,
                    ...(idx % 2 === 0
                      ? { right: -120, top: 120 }
                      : { left: -130, bottom: 40 }),
                  }}
                />

                {/* Header A4 */}
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

                {/* Hero A4 (Página 1 completa, Páginas seguintes compactas) */}
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
                          fontSize: 56,
                          lineHeight: 0.92,
                          letterSpacing: '-0.04em',
                          fontWeight: 700,
                          margin: 0,
                          maxWidth: 540,
                          color: '#F6F0EA',
                        }}
                      >
                        Roteiro de vídeos
                        <span style={{ color: '#FF741F', display: 'block' }}>
                          {displayClient}.
                        </span>
                      </h2>
                    </div>

                    <div style={{ display: 'flex', gap: 34, paddingBottom: 4 }}>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-title), "Bricolage Grotesque", sans-serif',
                            color: '#FF741F',
                            fontSize: 64,
                            lineHeight: 0.9,
                            fontWeight: 700,
                            letterSpacing: '-0.04em',
                          }}
                        >
                          {items.length}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
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
                            fontSize: 64,
                            lineHeight: 0.9,
                            fontWeight: 700,
                            letterSpacing: '-0.04em',
                          }}
                        >
                          {formatsCount}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
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
                ) : (
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      paddingTop: 16,
                      paddingBottom: 14,
                      borderBottom: '1px solid rgba(255,116,31,0.30)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11.5px',
                        letterSpacing: '0.24em',
                        textTransform: 'uppercase',
                        color: '#FF741F',
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      Briefing criativo • {displayClient}
                    </div>
                  </div>
                )}

                {/* Grade 2x2 de Cards de Vídeo */}
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
                        <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
                          <div
                            style={{
                              fontFamily: 'var(--font-title), "Bricolage Grotesque", sans-serif',
                              fontSize: 54,
                              lineHeight: 0.88,
                              color: '#FF741F',
                              fontWeight: 600,
                              letterSpacing: '-0.04em',
                              minWidth: 58,
                            }}
                          >
                            {String(item.n).padStart(2, '0')}
                          </div>
                          <div style={{ paddingTop: 2, minWidth: 0 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                border: '1px solid rgba(255,116,31,0.45)',
                                borderRadius: 999,
                                padding: '5px 11px',
                                fontSize: 13,
                                lineHeight: 1,
                                color: '#F6F0EA',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {cat}
                            </span>
                            <div
                              style={{
                                fontSize: 13,
                                color: 'rgba(246,240,234,0.55)',
                                marginTop: 7,
                                lineHeight: 1.3,
                              }}
                            >
                              {sub}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: '17.5px',
                            lineHeight: 1.45,
                            color: '#F6F0EA',
                            marginTop: 13,
                            whiteSpace: 'pre-line',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                          }}
                        >
                          {bodyParts.map((part, pIdx) =>
                            part.type === 'link' ? (
                              <a
                                key={pIdx}
                                href={part.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: '#FF741F',
                                  fontSize: 14,
                                  wordBreak: 'break-all',
                                  textDecoration: 'none',
                                }}
                              >
                                {part.display}
                              </a>
                            ) : (
                              <React.Fragment key={pIdx}>{part.value}</React.Fragment>
                            )
                          )}
                        </div>

                        {item.refs.map((r, rIdx) => (
                          <div key={rIdx} style={{ marginTop: 12 }}>
                            <div
                              style={{
                                fontSize: '11.5px',
                                letterSpacing: '0.24em',
                                textTransform: 'uppercase',
                                color: 'rgba(246,240,234,0.55)',
                                marginBottom: 5,
                              }}
                            >
                              {r.rotulo}
                            </div>
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#FF741F',
                                fontSize: 14,
                                wordBreak: 'break-all',
                                textDecoration: 'none',
                              }}
                            >
                              {exibirUrl(r.url)}
                            </a>
                          </div>
                        ))}
                      </article>
                    );
                  })}

                  {Array.from({ length: Math.max(0, 4 - chunk.length) }).map((_, emptyIdx) => (
                    <div
                      key={`empty-${emptyIdx}`}
                      style={{
                        border: '1px dashed rgba(255,116,31,0.25)',
                        background: 'rgba(255,116,31,0.045)',
                        borderRadius: 16,
                        padding: 20,
                        opacity: 0.35,
                      }}
                    />
                  ))}
                </div>

                {/* Rodapé A4 */}
                <div
                  style={{
                    position: 'absolute',
                    left: 44,
                    right: 44,
                    bottom: 24,
                    zIndex: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'rgba(246,240,234,0.55)',
                    fontSize: '10.5px',
                  }}
                >
                  <span>Navegando MKT • Briefing criativo {displayClient}</span>
                  <span>
                    {idx + 1} / {pages.length}
                  </span>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
