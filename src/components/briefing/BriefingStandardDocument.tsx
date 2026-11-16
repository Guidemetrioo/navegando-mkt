'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Eye, FileText, X } from 'lucide-react';
import {
  BriefingDocumentData,
  exibirUrl,
  inferCategory,
  inferSub,
  parseBodyWithLinks,
} from '@/lib/briefing-document';

export function NavegandoBrandLogo({ height = 48 }: { height?: number }) {
  return (
    <svg
      style={{ height, width: 'auto', display: 'block' }}
      viewBox="0 0 1084 613"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Navegando MKT"
    >
      <path
        d="M11.1492 564.243V449.566H30.5806L83.7782 530.397V449.566H103.21V564.243H83.7782L30.5806 483.411V564.243H11.1492ZM136.78 566.632C130.569 566.632 125.313 565.464 121.012 563.128C116.712 560.739 113.447 557.58 111.217 553.651C109.04 549.723 107.952 545.396 107.952 540.671C107.952 536.529 108.642 532.813 110.022 529.521C111.403 526.177 113.526 523.31 116.393 520.921C119.26 518.478 122.977 516.487 127.543 514.948C130.994 513.833 135.028 512.824 139.647 511.922C144.319 511.019 149.363 510.196 154.778 509.453C160.247 508.656 165.954 507.807 171.9 506.904L165.052 510.807C165.105 504.86 163.777 500.48 161.07 497.667C158.362 494.853 153.796 493.446 147.372 493.446C143.497 493.446 139.754 494.348 136.143 496.153C132.533 497.959 130.011 501.064 128.578 505.471L111.058 499.976C113.181 492.702 117.216 486.862 123.163 482.456C129.162 478.049 137.232 475.846 147.372 475.846C155.017 475.846 161.733 477.094 167.52 479.589C173.36 482.084 177.687 486.172 180.501 491.853C182.041 494.879 182.97 497.985 183.289 501.171C183.607 504.303 183.766 507.727 183.766 511.444V564.243H166.963V545.608L169.75 548.634C165.875 554.846 161.335 559.412 156.132 562.332C150.982 565.199 144.532 566.632 136.78 566.632ZM140.603 551.342C144.957 551.342 148.673 550.572 151.752 549.032C154.832 547.493 157.274 545.608 159.079 543.378C160.937 541.148 162.185 539.051 162.822 537.087C163.831 534.645 164.388 531.857 164.494 528.725C164.653 525.54 164.733 522.965 164.733 521L170.626 522.752C164.839 523.655 159.875 524.451 155.734 525.141C151.593 525.832 148.036 526.495 145.063 527.132C142.09 527.716 139.462 528.38 137.179 529.123C134.949 529.92 133.064 530.849 131.524 531.91C129.985 532.972 128.79 534.193 127.941 535.574C127.144 536.954 126.746 538.573 126.746 540.432C126.746 542.555 127.277 544.44 128.339 546.086C129.401 547.679 130.94 548.953 132.958 549.908C135.028 550.864 137.577 551.342 140.603 551.342ZM211.901 564.243L180.683 478.235H199.875L221.537 540.591L243.118 478.235H262.391L231.173 564.243H211.901ZM299.932 566.632C291.225 566.632 283.58 564.748 276.997 560.978C270.413 557.209 265.263 551.979 261.547 545.29C257.884 538.6 256.052 530.902 256.052 522.195C256.052 512.798 257.857 504.648 261.467 497.746C265.078 490.791 270.095 485.402 276.519 481.58C282.943 477.757 290.376 475.846 298.817 475.846C307.737 475.846 315.302 477.943 321.514 482.137C327.779 486.278 332.424 492.145 335.45 499.737C338.476 507.329 339.618 516.275 338.875 526.575H319.841V519.567C319.788 510.223 318.142 503.4 314.904 499.1C311.665 494.8 306.569 492.649 299.614 492.649C291.756 492.649 285.916 495.092 282.093 499.976C278.271 504.807 276.359 511.895 276.359 521.239C276.359 529.946 278.271 536.689 282.093 541.467C285.916 546.245 291.491 548.634 298.817 548.634C303.542 548.634 307.604 547.599 311.002 545.528C314.453 543.405 317.107 540.352 318.965 536.37L337.919 542.104C334.627 549.855 329.531 555.881 322.629 560.182C315.78 564.482 308.214 566.632 299.932 566.632ZM270.307 526.575V512.081H329.477V526.575H270.307ZM380.057 604.858C375.279 604.858 370.686 604.115 366.28 602.628C361.926 601.142 357.998 598.992 354.493 596.178C350.989 593.417 348.123 590.072 345.893 586.143L363.572 577.383C365.218 580.516 367.527 582.825 370.501 584.312C373.527 585.851 376.739 586.621 380.137 586.621C384.118 586.621 387.676 585.904 390.808 584.471C393.94 583.091 396.356 581.02 398.055 578.259C399.807 575.552 400.63 572.154 400.524 568.066V543.617H402.913V478.235H419.716V568.384C419.716 570.561 419.61 572.632 419.398 574.596C419.238 576.613 418.946 578.578 418.522 580.489C417.248 586.064 414.805 590.63 411.195 594.187C407.585 597.797 403.099 600.478 397.736 602.23C392.427 603.982 386.534 604.858 380.057 604.858ZM378.385 566.632C370.474 566.632 363.572 564.641 357.679 560.659C351.786 556.678 347.22 551.262 343.981 544.414C340.743 537.565 339.124 529.84 339.124 521.239C339.124 512.532 340.743 504.781 343.981 497.985C347.273 491.136 351.919 485.747 357.918 481.819C363.917 477.837 370.978 475.846 379.101 475.846C387.277 475.846 394.126 477.837 399.648 481.819C655.214 485.747 659.435 491.136 662.302 497.985C665.169 504.834 666.603 512.585 666.603 521.239C666.603 529.787 665.169 537.512 662.302 544.414C659.435 551.262 655.161 556.678 649.481 560.659C643.8 564.641 636.765 566.632 628.377 566.632ZM784.314 564.243V449.566H801.595L841.254 530.796L880.914 449.566H898.195V564.243H880.276V490.738L845.077 564.243H837.432L802.312 490.738V564.243H784.314ZM907.826 564.243V449.566H927.018V502.763L972.81 449.566H996.382L947.087 505.79L999.727 564.243H975.358L927.018 510.727V564.243H907.826ZM1025.76 564.243V467.564H988.651V449.566H1082.07V467.564H1044.95V564.243H1025.76Z"
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

export async function generateBriefingPdfBlob(container: HTMLElement): Promise<Blob> {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
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
        links = Array.from(el.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')).flatMap((a) =>
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
}

export function downloadBriefingBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Standard Navegando MKT A4 PDF pages (Reference: "Briefing - Flor do Paraíso.pdf"). */
export function BriefingDocumentPages({ doc }: { doc: BriefingDocumentData }) {
  return (
    <>
      {doc.pages.map((chunk, idx) => (
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
            fontFamily: 'var(--font-body), "Instrument Sans", sans-serif',
          }}
        >
          {/* Ambient Orange Glows */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 0,
              background:
                idx % 2 === 0
                  ? 'radial-gradient(circle at 82% 20%, rgba(255,116,31,0.16) 0%, rgba(255,116,31,0.05) 34%, transparent 65%), radial-gradient(circle at 18% 78%, rgba(255,116,31,0.08) 0%, transparent 55%)'
                  : 'radial-gradient(circle at 16% 74%, rgba(255,116,31,0.16) 0%, rgba(255,116,31,0.05) 34%, transparent 65%), radial-gradient(circle at 82% 22%, rgba(255,116,31,0.07) 0%, transparent 55%)',
            }}
          />

          {/* Top Header */}
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
              <span>Cliente · {doc.displayClient}</span>
              <span
                style={{
                  width: 1,
                  height: 16,
                  background: '#FF741F',
                  opacity: 0.7,
                }}
              />
              <span>{doc.displayDate}</span>
            </div>
          </div>

          {/* Hero na Página 1 / Subheader na Página 2+ */}
          {idx === 0 ? (
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingTop: 14,
                paddingBottom: 14,
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
                  Briefing Criativo
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
                  <span style={{ color: '#FF741F', display: 'block' }}>{doc.displayClient}.</span>
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
                    {doc.items.length}
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
                    {doc.formatsCount}
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
          ) : (
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                paddingTop: 18,
                paddingBottom: 12,
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
                }}
              >
                Briefing Criativo · {doc.displayClient}
              </div>
            </div>
          )}

          {/* Grade 2x2 de Cards da Página */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: 14,
              marginTop: 16,
              height: idx === 0 ? 790 : 905,
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
                    border: '1px solid rgba(255,116,31,0.38)',
                    background: 'rgba(255,116,31,0.035)',
                    borderRadius: 16,
                    padding: '22px 22px',
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-title), "Bricolage Grotesque", sans-serif',
                        fontSize: 48,
                        lineHeight: 0.88,
                        color: '#FF741F',
                        fontWeight: 700,
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
                          padding: '3px 12px',
                          fontSize: 12,
                          color: '#F6F0EA',
                        }}
                      >
                        {cat}
                      </span>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: 'rgba(246,240,234,0.58)',
                          marginTop: 5,
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
                      marginTop: 14,
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
                          style={{ color: '#FF741F', fontSize: 13.5 }}
                        >
                          {part.display}
                        </a>
                      ) : (
                        <React.Fragment key={pIdx}>{part.value}</React.Fragment>
                      )
                    )}
                  </div>

                  {item.refs.map((r, rIdx) => (
                    <div key={rIdx} style={{ marginTop: 14 }}>
                      <div
                        style={{
                          fontSize: '10.5px',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color: 'rgba(246,240,234,0.52)',
                          marginBottom: 4,
                        }}
                      >
                        {r.rotulo}
                      </div>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#FF741F', fontSize: 13.5, lineHeight: 1.35, wordBreak: 'break-all' }}
                      >
                        {exibirUrl(r.url)}
                      </a>
                    </div>
                  ))}
                </article>
              );
            })}
          </div>

          {/* Rodapé da Folha A4 */}
          <div
            style={{
              position: 'absolute',
              left: 44,
              right: 44,
              bottom: 20,
              zIndex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11.5px',
              color: 'rgba(246,240,234,0.48)',
            }}
          >
            <span>Navegando MKT · Briefing criativo {doc.displayClient}</span>
            <span>
              {idx + 1} / {doc.pages.length}
            </span>
          </div>
        </section>
      ))}
    </>
  );
}

/** Visual file card styled like the WhatsApp PDF attachment referencing the standard document. */
export function BriefingPdfFileCard({
  doc,
  onOpen,
  onDownloadPdf,
  isDownloading,
}: {
  doc: BriefingDocumentData;
  onOpen: () => void;
  onDownloadPdf?: () => void;
  isDownloading?: boolean;
}) {
  const hasContent = doc.items.length > 0;
  const pageCount = doc.pages.length;

  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-md max-w-md">
      {/* Miniatura visual do topo da folha padrão */}
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left relative overflow-hidden cursor-pointer group block"
        style={{
          background: '#0A0705',
          color: '#F6F0EA',
          padding: '14px 16px 12px',
        }}
        title={`Abrir "${doc.fileName}"`}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at 85% 20%, rgba(255,116,31,0.22) 0%, rgba(255,116,31,0.06) 40%, transparent 70%)',
          }}
        />
        <div className="relative z-10 flex items-center justify-between gap-2 mb-2">
          <NavegandoBrandLogo height={20} />
          <span className="text-[9px] tracking-[0.16em] uppercase text-[#F6F0EA]/70 truncate">
            CLIENTE · {doc.displayClient} | {doc.displayDate}
          </span>
        </div>
        <div className="relative z-10 flex items-end justify-between gap-3 border-b border-[rgba(255,116,31,0.28)] pb-2">
          <div className="min-w-0">
            <div className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#FF741F]">
              Briefing Criativo
            </div>
            <div className="text-lg font-extrabold leading-tight tracking-tight text-[#F6F0EA]">
              Roteiro de vídeos
              <span className="block text-[#FF741F] truncate">{doc.displayClient}.</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-right">
            <div>
              <div className="text-base font-extrabold leading-none text-[#FF741F]">{doc.items.length}</div>
              <div className="text-[8px] uppercase tracking-wider text-[#F6F0EA]/65 mt-0.5">vídeos</div>
            </div>
            <div>
              <div className="text-base font-extrabold leading-none text-[#FF741F]">{doc.formatsCount}</div>
              <div className="text-[8px] uppercase tracking-wider text-[#F6F0EA]/65 mt-0.5">formatos</div>
            </div>
          </div>
        </div>
      </button>

      {/* Linha de identificação do arquivo PDF */}
      <div
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        className="px-3.5 py-3 flex items-center gap-3 bg-[var(--ui-raised)] hover:bg-[var(--ui-hover)] transition-colors cursor-pointer"
      >
        <div className="w-10 h-11 rounded-lg bg-rose-600 text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
          <FileText className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-black tracking-wider leading-none">PDF</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-foreground truncate">{doc.fileName}</div>
          <div className="text-xs text-[var(--ui-muted)] flex items-center gap-1.5 flex-wrap">
            <span>
              {pageCount} {pageCount === 1 ? 'página' : 'páginas'} · PDF · {doc.items.length}{' '}
              {doc.items.length === 1 ? 'vídeo' : 'vídeos'}
            </span>
            {!hasContent && <span className="text-amber-400 font-semibold">(em definição)</span>}
          </div>
        </div>
      </div>

      {/* Barra inferior Abrir / Baixar PDF */}
      <div className="grid grid-cols-2 divide-x divide-[var(--ui-border)] border-t border-[var(--ui-border)] bg-[var(--ui-surface)]">
        <button
          type="button"
          onClick={onOpen}
          className="py-2.5 px-3 text-xs font-extrabold text-emerald-400 hover:bg-[var(--ui-raised)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Abrir</span>
        </button>
        <button
          type="button"
          onClick={onDownloadPdf || onOpen}
          disabled={isDownloading}
          className="py-2.5 px-3 text-xs font-extrabold text-foreground hover:bg-[var(--ui-raised)] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 text-[var(--ui-accent)]" />
          <span>{isDownloading ? 'Gerando…' : 'Baixar PDF'}</span>
        </button>
      </div>
    </div>
  );
}

/** Modal viewer rendering the exact standard A4 visual document (Image 1). */
export function BriefingPdfViewerModal({
  open,
  doc,
  onClose,
  onDownloadPdf,
  isDownloading,
}: {
  open: boolean;
  doc: BriefingDocumentData;
  onClose: () => void;
  onDownloadPdf: () => void;
  isDownloading?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!open) return;
    const updateScale = () => {
      const avail = Math.max(280, window.innerWidth - 64);
      setScale(Math.min(1, avail / 794));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={doc.fileName}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top bar */}
      <div className="px-4 py-3 bg-[#120d0a] border-b border-[rgba(255,116,31,0.28)] flex flex-wrap items-center justify-between gap-2 text-[#F6F0EA] shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-rose-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
            PDF
          </div>
          <span className="text-sm font-bold truncate">{doc.fileName}</span>
          <span className="text-xs text-[#F6F0EA]/60 hidden sm:inline">
            · {doc.pages.length} {doc.pages.length === 1 ? 'página' : 'páginas'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isDownloading}
            className="px-3 py-1.5 rounded-lg bg-[#FF741F] hover:bg-[#ff853b] text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloading ? 'Gerando PDF…' : 'Baixar PDF'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#F6F0EA] font-semibold text-xs flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fechar</span>
          </button>
        </div>
      </div>

      {/* Standard Document Body */}
      <div
        className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center bg-[#15100d]"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{
            width: 794 * scale,
            minHeight: 1123 * scale,
          }}
        >
          <div
            ref={containerRef}
            className="flex flex-col gap-7 items-center origin-top-left"
            style={{
              width: 794,
              transform: `scale(${scale})`,
            }}
          >
            <BriefingDocumentPages doc={doc} />
          </div>
        </div>
      </div>
    </div>
  );
}
