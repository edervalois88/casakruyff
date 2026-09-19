"use client";

import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Preloader } from "@/components/Preloader";
import { Emblem } from "@/components/Emblem";
import { Wordmark } from "@/components/Wordmark";
import { SplitHeadline } from "@/components/SplitHeadline";
import { Waitlist } from "@/components/Waitlist";
import { Footer } from "@/components/Footer";
import { Reveal, RevealText, enter } from "@/components/Reveal";
import { STAGGER } from "@/lib/entrance";

/**
 * Composición de la página.
 *
 * Una sola pantalla, sin scroll: se lee como una invitación impresa. El emblema
 * es un marco vacío —literalmente el sitio que todavía no existe— y la entrada
 * lo va componiendo: primero el marco, luego la palabra, luego la regla dorada y
 * por último el texto. El orden reproduce cómo se arma una pieza en el atelier.
 *
 * `animating` llega del preloader y vale `false` en el servidor y con movimiento
 * reducido. En ese caso todo se renderiza ya visible y sin Motion: es la versión
 * que ve quien llega sin JavaScript, y la que evita que un `opacity: 0` inicial
 * se quede fijado para siempre.
 *
 * `intro` marca los bloques de primer nivel como `hidden` mientras el velo tapa
 * la pantalla. Es lo que hace que los elementos se monten ya animados: nunca
 * llegan a pintarse en su estado inicial.
 */
export default function Page() {
  return (
    <LanguageProvider>
      <Preloader>
        {(animating, intro) => <Experience animating={animating} intro={intro} />}
      </Preloader>
    </LanguageProvider>
  );
}

function Experience({ animating, intro }: { animating: boolean; intro: boolean }) {
  const { t } = useLanguage();

  return (
    <>
      <div className="paper" aria-hidden="true" hidden={intro} />
      <span className="corner corner--tl" aria-hidden="true" hidden={intro} />
      <span className="corner corner--tr" aria-hidden="true" hidden={intro} />
      <span className="corner corner--bl" aria-hidden="true" hidden={intro} />
      <span className="corner corner--br" aria-hidden="true" hidden={intro} />

      <a className="skip" href="#contenido" hidden={intro}>
        {t.skip}
      </a>

      <div className="frame" hidden={intro}>
        <header className="top">
          <span className="top__mark">{t.topmark}</span>
          <LanguageSwitch />
        </header>

        <main className="stage" id="contenido">
          <Reveal
            animating={animating}
            className="lockup"
            from={{ opacity: 0, scale: 0.985 }}
            to={{ opacity: 1, scale: 1 }}
            timing={enter(STAGGER.emblem, 1.7)}
          >
            <Emblem width={140} animating={animating} />
            <Wordmark animating={animating} delay={STAGGER.wordmark} width={320} />
          </Reveal>

          <Reveal
            animating={animating}
            className="rule"
            from={{ scaleX: 0, opacity: 0 }}
            to={{ scaleX: 1, opacity: 1 }}
            timing={enter(STAGGER.rule)}
          />

          <div className="message">
            <RevealText
              animating={animating}
              className="eyebrow"
              from={{ opacity: 0, y: 10 }}
              to={{ opacity: 1, y: 0 }}
              timing={enter(STAGGER.eyebrow, 1.3)}
            >
              {t.eyebrow}
            </RevealText>

            <SplitHeadline
              animating={animating}
              text={t.headline}
              delay={STAGGER.headline}
            />

            <RevealText
              animating={animating}
              className="body"
              from={{ opacity: 0, y: 14 }}
              to={{ opacity: 1, y: 0 }}
              timing={enter(STAGGER.body)}
            >
              {t.body}
            </RevealText>
          </div>

          <Waitlist animating={animating} />
        </main>

        <Footer animating={animating} />
      </div>
    </>
  );
}
