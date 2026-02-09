import { useState } from 'react';
import styles from './Footer.module.css';

type ModalType = 'impressum' | 'datenschutz' | null;

export function Footer() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.links}>
          <button
            className={styles.link}
            onClick={() => setActiveModal('impressum')}
          >
            Impressum
          </button>
          <span className={styles.separator}>|</span>
          <button
            className={styles.link}
            onClick={() => setActiveModal('datenschutz')}
          >
            Datenschutz
          </button>
        </div>
        <div className={styles.copyright}>
          &copy; {new Date().getFullYear()} qStivi
        </div>
      </footer>

      {activeModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={closeModal}>
              &times;
            </button>
            <div className={styles.modalContent}>
              {activeModal === 'impressum' ? <Impressum /> : <Datenschutz />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Impressum() {
  return (
    <div className={styles.legal}>
      <h2>Impressum</h2>

      <h3>Angaben gemäß § 5 TMG</h3>
      <p>
        Stephan Glaue (alias qStivi)<br />
        E-Mail: stephanglaue@outlook.com
      </p>

      <h3>Haftungsausschluss</h3>

      <h4>Haftung für Inhalte</h4>
      <p>
        Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
        Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
      </p>

      <h4>Haftung für Links</h4>
      <p>
        Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen
        Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
        Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
        Seiten verantwortlich.
      </p>

      <h3>Urheberrecht</h3>
      <p>
        Die Anime-Daten und Cover-Bilder stammen von AniList und unterliegen deren jeweiligen
        Urheberrechten. Diese Webseite ist ein nicht-kommerzielles Hobbyprojekt.
      </p>
    </div>
  );
}

function Datenschutz() {
  return (
    <div className={styles.legal}>
      <h2>Datenschutzerklärung</h2>

      <h3>1. Datenschutz auf einen Blick</h3>

      <h4>Allgemeine Hinweise</h4>
      <p>
        Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
        personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
      </p>

      <h3>2. Datenerfassung auf dieser Website</h3>

      <h4>Wer ist verantwortlich für die Datenerfassung?</h4>
      <p>
        Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber:<br />
        Stephan Glaue (alias qStivi)<br />
        E-Mail: stephanglaue@outlook.com
      </p>

      <h4>Welche Daten werden erfasst?</h4>
      <p>
        <strong>Bei der Nutzung ohne Login:</strong><br />
        Es werden keine personenbezogenen Daten erfasst. Es werden keine Cookies gesetzt
        und keine Tracking-Dienste verwendet.
      </p>
      <p>
        <strong>Bei der Nutzung mit AniList-Login:</strong><br />
        Wenn Sie sich mit Ihrem AniList-Account anmelden, werden folgende Daten verarbeitet:
      </p>
      <ul>
        <li>Ihre AniList-Benutzer-ID und Benutzername</li>
        <li>Ihr AniList-Profilbild (URL)</li>
        <li>Ihre abgeschlossene Anime-Liste von AniList</li>
        <li>Ein Authentifizierungs-Token für die AniList-API</li>
      </ul>

      <h4>Wie werden Ihre Daten gespeichert?</h4>
      <p>
        <strong>Lokal im Browser:</strong><br />
        Ihre Ranking-Daten, Ordner und Einstellungen werden ausschließlich im LocalStorage
        Ihres Browsers gespeichert. Diese Daten verlassen Ihr Gerät nicht und werden nicht
        an unsere Server übertragen.
      </p>
      <p>
        <strong>Session-Cookie:</strong><br />
        Ein httpOnly-Cookie wird verwendet, um Ihre AniList-Authentifizierung zu speichern.
        Dieses Cookie ist technisch notwendig und enthält nur das verschlüsselte
        Authentifizierungs-Token.
      </p>

      <h4>Kommunikation mit externen Diensten</h4>
      <p>
        Diese Website kommuniziert mit der AniList-API (https://anilist.co), um:
      </p>
      <ul>
        <li>Sie zu authentifizieren (OAuth2)</li>
        <li>Ihre Anime-Liste abzurufen</li>
        <li>Ihre Bewertungen zu synchronisieren (nur wenn Sie dies aktiv auslösen)</li>
      </ul>
      <p>
        Für die Datenverarbeitung durch AniList gelten deren eigene Datenschutzbestimmungen:
        <a href="https://anilist.co/terms" target="_blank" rel="noopener noreferrer">
          https://anilist.co/terms
        </a>
      </p>

      <h3>3. Ihre Rechte</h3>
      <p>
        Sie haben jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten
        personenbezogenen Daten. Da alle Ranking-Daten lokal in Ihrem Browser gespeichert
        werden, können Sie diese jederzeit selbst einsehen, exportieren oder löschen:
      </p>
      <ul>
        <li>Über die Export-Funktion können Sie Ihre Daten als JSON-Datei herunterladen</li>
        <li>Durch Löschen der Browser-Daten werden alle lokalen Daten entfernt</li>
        <li>Durch Logout wird die AniList-Verbindung getrennt</li>
      </ul>

      <h3>4. Hosting und CDN</h3>

      <h4>Cloudflare</h4>
      <p>
        Diese Website nutzt Cloudflare als Content Delivery Network (CDN) und Sicherheitsdienst.
        Cloudflare ist ein US-amerikanisches Unternehmen, das unter dem EU-US Data Privacy
        Framework zertifiziert ist.
      </p>
      <p>
        Bei jedem Zugriff auf diese Website werden folgende Daten an Cloudflare übermittelt:
      </p>
      <ul>
        <li>Ihre IP-Adresse</li>
        <li>Aufgerufene URL</li>
        <li>Datum und Uhrzeit des Zugriffs</li>
        <li>Übertragene Datenmenge</li>
        <li>Browser-Typ und -Version</li>
        <li>Betriebssystem</li>
      </ul>
      <p>
        Diese Daten werden von Cloudflare verarbeitet, um die Website vor Angriffen zu
        schützen und die Auslieferung zu optimieren. Die Verarbeitung erfolgt auf Grundlage
        unseres berechtigten Interesses an einer sicheren und effizienten Bereitstellung
        unserer Website (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <p>
        Weitere Informationen finden Sie in der Datenschutzerklärung von Cloudflare:{' '}
        <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">
          https://www.cloudflare.com/privacypolicy/
        </a>
      </p>

      <h4>Server</h4>
      <p>
        Die Website wird auf einem privaten Server gehostet. Es werden Server-Logs
        gespeichert, die IP-Adressen, Zeitstempel und aufgerufene URLs enthalten können.
        Diese Logs dienen ausschließlich der Fehleranalyse und Sicherheit und werden
        regelmäßig gelöscht.
      </p>
    </div>
  );
}
