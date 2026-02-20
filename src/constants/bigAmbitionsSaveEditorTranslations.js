/**
 * Big Ambitions 세이브 에디터 페이지 다국어 문구
 * - 입력: 없음 (상수)
 * - 출력: { [locale]: { [key]: string } }
 * - 지원: ko, en, zh, ja, th, fr, de, it, ru, es, pt, nl, tr, no, pl, cs
 */
export const LOCALES = [
    { code: "ko", label: "한국어" },
    { code: "en", label: "English" },
    { code: "zh", label: "中文" },
    { code: "ja", label: "日本語" },
    { code: "th", label: "ไทย" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
    { code: "it", label: "Italiano" },
    { code: "ru", label: "Русский" },
    { code: "es", label: "Español" },
    { code: "pt", label: "Português" },
    { code: "nl", label: "Nederlands" },
    { code: "tr", label: "Türkçe" },
    { code: "no", label: "Norsk" },
    { code: "pl", label: "Polski" },
    { code: "cs", label: "Čeština" }
];

export const BIG_AMBITIONS_SAVE_EDITOR_TRANSLATIONS = {
    ko: {
        title: "Big Ambitions 세이브 에디터",
        description: ".hsg 세이브 파일을 선택한 뒤 Money / Energy / NetWorth를 수정하고, 수정된 파일을 다운로드할 수 있습니다. 게임을 끈 상태에서 파일을 교체하세요.",
        saveFileLabel: "세이브 파일 (.hsg)",
        chooseFileButton: "파일 선택",
        editValuesLabel: "수정할 값 (비워두면 변경하지 않음)",
        placeholderMoney: "예: 1000000",
        placeholderEnergy: "예: 100",
        placeholderNetWorth: "예: 1000000",
        btnReload: "다시 읽기",
        btnSave: "저장 (다운로드)",
        errorFileRead: "파일을 읽을 수 없습니다.",
        msgSelectFile: "먼저 세이브 파일을 선택하세요.",
        msgEnterValue: "수정할 값을 하나 이상 입력하세요.",
        msgSaveError: "저장 처리 중 오류가 발생했습니다.",
        msgReloaded: "값을 다시 읽었습니다.",
        msgDownloadStarted: "다운로드가 시작되었습니다. 게임을 끈 상태에서 파일을 교체하세요.",
        disclaimer: "비공식 팬 도구입니다. 게임 이용약관 및 해당 국가 법률을 확인한 후 사용할 책임은 사용자에게 있습니다.",
        languageLabel: "설명 언어"
    },
    en: {
        title: "Big Ambitions Save Editor",
        description: "Select a .hsg save file to edit Money / Energy / NetWorth, then download the modified file. Replace the file while the game is closed.",
        saveFileLabel: "Save file (.hsg)",
        chooseFileButton: "Choose file",
        editValuesLabel: "Values to edit (leave blank to keep unchanged)",
        placeholderMoney: "e.g. 1000000",
        placeholderEnergy: "e.g. 100",
        placeholderNetWorth: "e.g. 1000000",
        btnReload: "Reload",
        btnSave: "Save (Download)",
        errorFileRead: "Could not read the file.",
        msgSelectFile: "Please select a save file first.",
        msgEnterValue: "Enter at least one value to change.",
        msgSaveError: "An error occurred while saving.",
        msgReloaded: "Values reloaded.",
        msgDownloadStarted: "Download started. Replace the file while the game is closed.",
        disclaimer: "Unofficial fan tool. You are responsible for use in accordance with the game's terms and applicable laws.",
        languageLabel: "Language"
    },
    zh: {
        title: "Big Ambitions 存档编辑器",
        description: "选择 .hsg 存档文件后可修改 Money / Energy / NetWorth，然后下载修改后的文件。请在关闭游戏后替换文件。",
        saveFileLabel: "存档文件 (.hsg)",
        chooseFileButton: "选择文件",
        editValuesLabel: "要修改的值（留空则保持不变）",
        placeholderMoney: "例如：1000000",
        placeholderEnergy: "例如：100",
        placeholderNetWorth: "例如：1000000",
        btnReload: "重新读取",
        btnSave: "保存（下载）",
        errorFileRead: "无法读取文件。",
        msgSelectFile: "请先选择存档文件。",
        msgEnterValue: "请至少输入一项要修改的值。",
        msgSaveError: "保存时发生错误。",
        msgReloaded: "已重新读取数值。",
        msgDownloadStarted: "已开始下载。请在关闭游戏后替换文件。",
        disclaimer: "非官方爱好者工具。请遵守游戏条款及当地法律，使用责任自负。",
        languageLabel: "语言"
    },
    ja: {
        title: "Big Ambitions セーブエディター",
        description: ".hsg セーブファイルを選択し、Money / Energy / NetWorth を編集してから、編集したファイルをダウンロードできます。ゲームを終了した状態でファイルを差し替えてください。",
        saveFileLabel: "セーブファイル (.hsg)",
        chooseFileButton: "ファイルを選択",
        editValuesLabel: "編集する値（空欄の場合は変更しません）",
        placeholderMoney: "例：1000000",
        placeholderEnergy: "例：100",
        placeholderNetWorth: "例：1000000",
        btnReload: "再読み込み",
        btnSave: "保存（ダウンロード）",
        errorFileRead: "ファイルを読み込めませんでした。",
        msgSelectFile: "先にセーブファイルを選択してください。",
        msgEnterValue: "変更する値を1つ以上入力してください。",
        msgSaveError: "保存処理中にエラーが発生しました。",
        msgReloaded: "値を再読み込みしました。",
        msgDownloadStarted: "ダウンロードを開始しました。ゲームを終了した状態でファイルを差し替えてください。",
        disclaimer: "非公式ファンツールです。ゲームの利用規約および該当国の法令を確認した上で、使用責任は利用者にあります。",
        languageLabel: "表示言語"
    },
    th: {
        title: "Big Ambitions ตัวแก้เซฟ",
        description: "เลือกไฟล์เซฟ .hsg เพื่อแก้ไข Money / Energy / NetWorth จากนั้นดาวน์โหลดไฟล์ที่แก้ไขแล้ว เปลี่ยนไฟล์ขณะปิดเกม",
        saveFileLabel: "ไฟล์เซฟ (.hsg)",
        chooseFileButton: "เลือกไฟล์",
        editValuesLabel: "ค่าที่จะแก้ไข (เว้นว่างไว้จะไม่เปลี่ยน)",
        placeholderMoney: "เช่น 1000000",
        placeholderEnergy: "เช่น 100",
        placeholderNetWorth: "เช่น 1000000",
        btnReload: "โหลดใหม่",
        btnSave: "บันทึก (ดาวน์โหลด)",
        errorFileRead: "อ่านไฟล์ไม่ได้",
        msgSelectFile: "กรุณาเลือกไฟล์เซฟก่อน",
        msgEnterValue: "กรุณาใส่ค่าที่จะเปลี่ยนอย่างน้อยหนึ่งค่า",
        msgSaveError: "เกิดข้อผิดพลาดระหว่างบันทึก",
        msgReloaded: "โหลดค่าคืนแล้ว",
        msgDownloadStarted: "เริ่มดาวน์โหลดแล้ว เปลี่ยนไฟล์ขณะปิดเกม",
        disclaimer: "เครื่องมือแฟนทำ ไม่เป็นทางการ ผู้ใช้รับผิดชอบการใช้งานตามข้อกำหนดของเกมและกฎหมายที่ใช้บังคับ",
        languageLabel: "ภาษา"
    },
    fr: {
        title: "Éditeur de sauvegarde Big Ambitions",
        description: "Sélectionnez un fichier de sauvegarde .hsg pour modifier Money / Energy / NetWorth, puis téléchargez le fichier modifié. Remplacez le fichier lorsque le jeu est fermé.",
        saveFileLabel: "Fichier de sauvegarde (.hsg)",
        chooseFileButton: "Choisir un fichier",
        editValuesLabel: "Valeurs à modifier (laisser vide pour ne pas modifier)",
        placeholderMoney: "ex. 1000000",
        placeholderEnergy: "ex. 100",
        placeholderNetWorth: "ex. 1000000",
        btnReload: "Recharger",
        btnSave: "Enregistrer (Télécharger)",
        errorFileRead: "Impossible de lire le fichier.",
        msgSelectFile: "Veuillez d'abord sélectionner un fichier de sauvegarde.",
        msgEnterValue: "Saisissez au moins une valeur à modifier.",
        msgSaveError: "Une erreur s'est produite lors de l'enregistrement.",
        msgReloaded: "Valeurs rechargées.",
        msgDownloadStarted: "Téléchargement démarré. Remplacez le fichier lorsque le jeu est fermé.",
        disclaimer: "Outil fan non officiel. Vous êtes responsable de l'utilisation conformément aux conditions du jeu et aux lois applicables.",
        languageLabel: "Langue"
    },
    de: {
        title: "Big Ambitions Speicher-Editor",
        description: "Wählen Sie eine .hsg-Speicherdatei, um Money / Energy / NetWorth zu bearbeiten, und laden Sie dann die geänderte Datei herunter. Ersetzen Sie die Datei, wenn das Spiel beendet ist.",
        saveFileLabel: "Speicherdatei (.hsg)",
        chooseFileButton: "Datei auswählen",
        editValuesLabel: "Zu bearbeitende Werte (leer lassen = unverändert)",
        placeholderMoney: "z. B. 1000000",
        placeholderEnergy: "z. B. 100",
        placeholderNetWorth: "z. B. 1000000",
        btnReload: "Neu laden",
        btnSave: "Speichern (Download)",
        errorFileRead: "Die Datei konnte nicht gelesen werden.",
        msgSelectFile: "Bitte wählen Sie zuerst eine Speicherdatei.",
        msgEnterValue: "Geben Sie mindestens einen Wert zum Ändern ein.",
        msgSaveError: "Beim Speichern ist ein Fehler aufgetreten.",
        msgReloaded: "Werte neu geladen.",
        msgDownloadStarted: "Download gestartet. Ersetzen Sie die Datei, wenn das Spiel beendet ist.",
        disclaimer: "Inoffizielles Fan-Tool. Sie sind für die Nutzung gemäß den Spielbedingungen und geltenden Gesetzen verantwortlich.",
        languageLabel: "Sprache"
    },
    it: {
        title: "Editor salvataggio Big Ambitions",
        description: "Seleziona un file di salvataggio .hsg per modificare Money / Energy / NetWorth, poi scarica il file modificato. Sostituisci il file con il gioco chiuso.",
        saveFileLabel: "File di salvataggio (.hsg)",
        chooseFileButton: "Scegli file",
        editValuesLabel: "Valori da modificare (lascia vuoto per non modificare)",
        placeholderMoney: "es. 1000000",
        placeholderEnergy: "es. 100",
        placeholderNetWorth: "es. 1000000",
        btnReload: "Ricarica",
        btnSave: "Salva (Scarica)",
        errorFileRead: "Impossibile leggere il file.",
        msgSelectFile: "Seleziona prima un file di salvataggio.",
        msgEnterValue: "Inserisci almeno un valore da modificare.",
        msgSaveError: "Si è verificato un errore durante il salvataggio.",
        msgReloaded: "Valori ricaricati.",
        msgDownloadStarted: "Download avviato. Sostituisci il file con il gioco chiuso.",
        disclaimer: "Strumento fan non ufficiale. Sei responsabile dell'uso in conformità con i termini del gioco e le leggi applicabili.",
        languageLabel: "Lingua"
    },
    ru: {
        title: "Редактор сохранений Big Ambitions",
        description: "Выберите файл сохранения .hsg для редактирования Money / Energy / NetWorth, затем скачайте изменённый файл. Замените файл при закрытой игре.",
        saveFileLabel: "Файл сохранения (.hsg)",
        chooseFileButton: "Выбрать файл",
        editValuesLabel: "Значения для изменения (оставьте пустым, чтобы не менять)",
        placeholderMoney: "напр. 1000000",
        placeholderEnergy: "напр. 100",
        placeholderNetWorth: "напр. 1000000",
        btnReload: "Перезагрузить",
        btnSave: "Сохранить (Скачать)",
        errorFileRead: "Не удалось прочитать файл.",
        msgSelectFile: "Сначала выберите файл сохранения.",
        msgEnterValue: "Введите хотя бы одно значение для изменения.",
        msgSaveError: "Произошла ошибка при сохранении.",
        msgReloaded: "Значения перезагружены.",
        msgDownloadStarted: "Загрузка началась. Замените файл при закрытой игре.",
        disclaimer: "Неофициальный фанатский инструмент. Вы несёте ответственность за использование в соответствии с условиями игры и применимым законодательством.",
        languageLabel: "Язык"
    },
    es: {
        title: "Editor de guardado Big Ambitions",
        description: "Selecciona un archivo de guardado .hsg para editar Money / Energy / NetWorth, luego descarga el archivo modificado. Reemplaza el archivo con el juego cerrado.",
        saveFileLabel: "Archivo de guardado (.hsg)",
        chooseFileButton: "Elegir archivo",
        editValuesLabel: "Valores a editar (dejar en blanco para no cambiar)",
        placeholderMoney: "ej. 1000000",
        placeholderEnergy: "ej. 100",
        placeholderNetWorth: "ej. 1000000",
        btnReload: "Recargar",
        btnSave: "Guardar (Descargar)",
        errorFileRead: "No se pudo leer el archivo.",
        msgSelectFile: "Por favor selecciona primero un archivo de guardado.",
        msgEnterValue: "Introduce al menos un valor para cambiar.",
        msgSaveError: "Ocurrió un error al guardar.",
        msgReloaded: "Valores recargados.",
        msgDownloadStarted: "Descarga iniciada. Reemplaza el archivo con el juego cerrado.",
        disclaimer: "Herramienta de fans no oficial. Eres responsable del uso conforme a los términos del juego y las leyes aplicables.",
        languageLabel: "Idioma"
    },
    pt: {
        title: "Editor de save Big Ambitions",
        description: "Selecione um ficheiro de save .hsg para editar Money / Energy / NetWorth e depois descarregue o ficheiro modificado. Substitua o ficheiro com o jogo fechado.",
        saveFileLabel: "Ficheiro de save (.hsg)",
        chooseFileButton: "Escolher ficheiro",
        editValuesLabel: "Valores a editar (deixar em branco para não alterar)",
        placeholderMoney: "ex. 1000000",
        placeholderEnergy: "ex. 100",
        placeholderNetWorth: "ex. 1000000",
        btnReload: "Recarregar",
        btnSave: "Guardar (Descarregar)",
        errorFileRead: "Não foi possível ler o ficheiro.",
        msgSelectFile: "Por favor selecione primeiro um ficheiro de save.",
        msgEnterValue: "Introduza pelo menos um valor para alterar.",
        msgSaveError: "Ocorreu um erro ao guardar.",
        msgReloaded: "Valores recarregados.",
        msgDownloadStarted: "Descarregamento iniciado. Substitua o ficheiro com o jogo fechado.",
        disclaimer: "Ferramenta de fãs não oficial. É responsável pela utilização em conformidade com os termos do jogo e leis aplicáveis.",
        languageLabel: "Idioma"
    },
    nl: {
        title: "Big Ambitions save-editor",
        description: "Selecteer een .hsg savebestand om Money / Energy / NetWorth te bewerken en download het gewijzigde bestand. Vervang het bestand wanneer het spel is gesloten.",
        saveFileLabel: "Savebestand (.hsg)",
        chooseFileButton: "Bestand kiezen",
        editValuesLabel: "Te bewerken waarden (leeg laten = ongewijzigd)",
        placeholderMoney: "bijv. 1000000",
        placeholderEnergy: "bijv. 100",
        placeholderNetWorth: "bijv. 1000000",
        btnReload: "Herladen",
        btnSave: "Opslaan (Download)",
        errorFileRead: "Kon het bestand niet lezen.",
        msgSelectFile: "Selecteer eerst een savebestand.",
        msgEnterValue: "Voer ten minste één waarde in om te wijzigen.",
        msgSaveError: "Er is een fout opgetreden bij het opslaan.",
        msgReloaded: "Waarden herladen.",
        msgDownloadStarted: "Download gestart. Vervang het bestand wanneer het spel is gesloten.",
        disclaimer: "Niet-officiële fantool. U bent verantwoordelijk voor gebruik in overeenstemming met de spelvoorwaarden en toepasselijke wetten.",
        languageLabel: "Taal"
    },
    tr: {
        title: "Big Ambitions kayıt düzenleyici",
        description: "Money / Energy / NetWorth düzenlemek için bir .hsg kayıt dosyası seçin, ardından değiştirilmiş dosyayı indirin. Dosyayı oyun kapatılmışken değiştirin.",
        saveFileLabel: "Kayıt dosyası (.hsg)",
        chooseFileButton: "Dosya seç",
        editValuesLabel: "Düzenlenecek değerler (değiştirmemek için boş bırakın)",
        placeholderMoney: "örn. 1000000",
        placeholderEnergy: "örn. 100",
        placeholderNetWorth: "örn. 1000000",
        btnReload: "Yeniden yükle",
        btnSave: "Kaydet (İndir)",
        errorFileRead: "Dosya okunamadı.",
        msgSelectFile: "Lütfen önce bir kayıt dosyası seçin.",
        msgEnterValue: "Değiştirmek için en az bir değer girin.",
        msgSaveError: "Kaydetme sırasında bir hata oluştu.",
        msgReloaded: "Değerler yeniden yüklendi.",
        msgDownloadStarted: "İndirme başladı. Dosyayı oyun kapatılmışken değiştirin.",
        disclaimer: "Gayri resmi hayran aracı. Oyun şartları ve geçerli yasalara uygun kullanımdan siz sorumlusunuz.",
        languageLabel: "Dil"
    },
    no: {
        title: "Big Ambitions lagringsredigerer",
        description: "Velg en .hsg lagringsfil for å redigere Money / Energy / NetWorth, deretter last ned den endrede filen. Erstatt filen mens spillet er lukket.",
        saveFileLabel: "Lagringsfil (.hsg)",
        chooseFileButton: "Velg fil",
        editValuesLabel: "Verdier å redigere (la stå tom for å beholde uendret)",
        placeholderMoney: "f.eks. 1000000",
        placeholderEnergy: "f.eks. 100",
        placeholderNetWorth: "f.eks. 1000000",
        btnReload: "Last inn på nytt",
        btnSave: "Lagre (Last ned)",
        errorFileRead: "Kunne ikke lese filen.",
        msgSelectFile: "Vennligst velg en lagringsfil først.",
        msgEnterValue: "Skriv inn minst én verdi å endre.",
        msgSaveError: "Det oppstod en feil under lagring.",
        msgReloaded: "Verdier lastet inn på nytt.",
        msgDownloadStarted: "Nedlasting startet. Erstatt filen mens spillet er lukket.",
        disclaimer: "Uoffisielt fantverktøy. Du er ansvarlig for bruk i tråd med spillvilkårene og gjeldende lover.",
        languageLabel: "Språk"
    },
    pl: {
        title: "Edytor zapisów Big Ambitions",
        description: "Wybierz plik zapisu .hsg, aby edytować Money / Energy / NetWorth, następnie pobierz zmodyfikowany plik. Zamień plik przy wyłączonej grze.",
        saveFileLabel: "Plik zapisu (.hsg)",
        chooseFileButton: "Wybierz plik",
        editValuesLabel: "Wartości do edycji (zostaw puste, aby nie zmieniać)",
        placeholderMoney: "np. 1000000",
        placeholderEnergy: "np. 100",
        placeholderNetWorth: "np. 1000000",
        btnReload: "Przeładuj",
        btnSave: "Zapisz (Pobierz)",
        errorFileRead: "Nie można odczytać pliku.",
        msgSelectFile: "Najpierw wybierz plik zapisu.",
        msgEnterValue: "Wprowadź co najmniej jedną wartość do zmiany.",
        msgSaveError: "Wystąpił błąd podczas zapisywania.",
        msgReloaded: "Wartości przeładowane.",
        msgDownloadStarted: "Pobieranie rozpoczęte. Zamień plik przy wyłączonej grze.",
        disclaimer: "Nieoficjalne narzędzie fanów. Odpowiadasz za użytkowanie zgodnie z warunkami gry i obowiązującym prawem.",
        languageLabel: "Język"
    },
    cs: {
        title: "Editor uložených her Big Ambitions",
        description: "Vyberte soubor uložení .hsg pro úpravu Money / Energy / NetWorth, poté stáhněte upravený soubor. Soubor nahraďte při zavřené hře.",
        saveFileLabel: "Soubor uložení (.hsg)",
        chooseFileButton: "Vybrat soubor",
        editValuesLabel: "Hodnoty k úpravě (nechte prázdné pro zachování)",
        placeholderMoney: "např. 1000000",
        placeholderEnergy: "např. 100",
        placeholderNetWorth: "např. 1000000",
        btnReload: "Znovu načíst",
        btnSave: "Uložit (Stáhnout)",
        errorFileRead: "Soubor se nepodařilo přečíst.",
        msgSelectFile: "Nejprve vyberte soubor uložení.",
        msgEnterValue: "Zadejte alespoň jednu hodnotu ke změně.",
        msgSaveError: "Při ukládání došlo k chybě.",
        msgReloaded: "Hodnoty znovu načteny.",
        msgDownloadStarted: "Stahování zahájeno. Soubor nahraďte při zavřené hře.",
        disclaimer: "Neoficiální fanouškovský nástroj. Za použití v souladu s podmínkami hry a platnými zákony odpovídáte vy.",
        languageLabel: "Jazyk"
    }
};

/** 기본 로케일(키 없을 때 폴백) */
export const DEFAULT_LOCALE = "en";

/**
 * 로케일 코드가 지원 목록에 있는지 확인
 * @param {string} code
 * @returns {boolean}
 */
export function isSupportedLocale(code) {
    return LOCALES.some((l) => l.code === code);
}

/**
 * 문장 끝 마침표(.) 또는 。 기준으로 줄바꿈. 파일 확장자(.hsg)의 마침표는 제외
 * @param {string} str
 * @returns {string}
 */
function sentenceBreak(str) {
    if (!str || typeof str !== "string") return str;
    let out = str.replace(/\.\s+/g, ".\n").replace(/\.hsg\n/g, ".hsg ");
    out = out.replace(/。\s*/g, "。\n");
    return out;
}

/** 문장 줄바꿈 적용할 키 목록 (description, disclaimer, 메시지 등) */
const SENTENCE_BREAK_KEYS = ["description", "msgDownloadStarted", "disclaimer"];

/**
 * 해당 로케일의 번역 객체 반환 (없으면 en 폴백). description 등은 마침표 기준 줄바꿈 적용
 * @param {string} locale
 * @returns {Record<string, string>}
 */
export function getTranslations(locale) {
    const raw = BIG_AMBITIONS_SAVE_EDITOR_TRANSLATIONS[locale] || BIG_AMBITIONS_SAVE_EDITOR_TRANSLATIONS[DEFAULT_LOCALE];
    const t = { ...raw };
    for (const key of SENTENCE_BREAK_KEYS) {
        if (t[key]) t[key] = sentenceBreak(t[key]);
    }
    return t;
}
