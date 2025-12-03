const detectUserLanguage = () => {
    return document.querySelector('.SidePanel select.language').value
};

class UnsupportedLanguageError extends Error {
    constructor(locale) {
        super(`Unsupported language: ${locale}`)
        this.name = UnsupportedLanguageError;
    }
}

const getBeneficiaryInLanguage = (user_lang) => {
    let ben_text;
    if (user_lang == "en"){
        ben_text = " - Beneficiaries "
    } else if (user_lang == "fr") {
        ben_text = " - Bénéficiaires "
    } else if (user_lang == "it") {
        ben_text = " - Beneficiari "
    } else if (user_lang == "ja"){
        ben_text = " - 受益者 "
    } else if (user_lang == "ko"){
        ben_text = " - 수혜자 "
    } else if (user_lang == "pl"){
        ben_text = " - Beneficjenci "
    } else if (user_lang == "ru"){
        ben_text = " - Бенефициары "
    } else if (user_lang == "es"){
        ben_text = " - Beneficiarios "
    } else if (user_lang == "uk"){
        ben_text = " - Бенефіціари "
    } else {
        throw new UnsupportedLanguageError(user_lang) // Language not accounted for
    }

    return ben_text
}

const getEfficiencyMetricsInLang = (user_lang) => {
    let rewards = "Rewards";
    let contributed = "Contributed";
    let received = "Received";
    let author = "Author";

    switch (user_lang) {
        case "fr":
            rewards = "Récompenses";
            contributed = "A contribué";
            received = "Reçu";
            author = "Auteur";
            break;
        case "it":
            rewards = "Ricompense";
            contributed = "Contribuito";
            received = "Ricevuto";
            author = "Autore";
            break;
        case "ja":
            rewards = "報酬"
            contributed = "寄稿"
            received = "受け取った"
            author = "著者"
            break;
        case "ko":
            rewards = "보상";
            contributed = "기여했다";
            received = "받았다";
            author = "작가";
            break;
        case "pl":
            rewards = "Nagrody";
            contributed = "Wkład";
            received = "Otrzymane";
            author = "Autor";
            break;
        case "ru":
            rewards = "Награды";
            contributed = "Внесено";
            received = "Полученный";
            author = "Автор";
            break
        case "es":
            rewards = "Recompensas";
            contributed = "Contribuyó";
            received = "Recibido";
            author = "Autor";
            break
        case "uk":
            rewards = "Нагороди";
            contributed = "Внесок";
            received = "Отримано";
            author = "Автор";
            break;
    }

    return {
        rewards,
        contributed,
        received,
        author
    }
}

const formatValueLanguage = (currencySymbol = "$", value, user_lang) => {
    if (!isFinite(value)) return;
    if(['fr', 'pl', 'ru', 'uk'].includes(user_lang)) return `${value} ${currencySymbol}`;
    else return `${currencySymbol}${value}`;
}

const formatDateLanguage = (date, user_lang) => {
    const LOCALE_MAP = {
        en: 'en-US',
        fr: 'fr-FR',
        ja: 'ja-JP',
        ko: 'ko-KR',
        pl: 'pl-PL',
        ru: 'ru-RU',
        es: 'es-ES',
        uk: 'uk-UA'
    };
    const formattedDate = new Intl.DateTimeFormat(LOCALE_MAP[user_lang] ?? user_lang, {month: '2-digit', day:'2-digit'}).format(date);
    return formattedDate;
}

const getEfficiencyGraphInLang = (user_lang) => {
    let date = "Date";
    let efficiency = "Efficiency";
    let weightedEff = "Weighted Eff";
    let voterReceived = "Voter Received";
    let totalValue = "Post Total";
    let mean = "Mean";
    let median = "Median";

    switch (user_lang){
        case 'fr':
            date = "Date";
            efficiency = "Efficacité";
            weightedEff = "Pondéré Eff";
            voterReceived = "Électeur Reçu";
            totalValue = "Valeur Totale";
            mean = "Moyenne";
            median = "Médiane";
            break;
        case 'it':
            date = "Data";
            efficiency = "Efficienza";
            weightedEff = "Eff Ponderata";
            voterReceived = "Elettore Ricevuto";
            totalValue = "Valore Totale";
            mean = "Media";
            median = "Mediana";
        case 'ja':
            date = "日付";
            efficiency = "効率";
            weightedEff = "加重効率";
            voterReceived = "投票者受付";
            totalValue = "合計金額";
            mean = "平均";
            median = "中央値";
            break;
        case 'ko':
            date = "날짜";
            efficiency = "능률";
            weightedEff = "가중 효율성";
            voterReceived = "유권자 접수";
            totalValue = "총 가치";
            mean = "평균";
            median = "중앙값";
            break;
        case 'pl':
            date = "Data";
            efficiency = "Efektywność";
            weightedEff = "Ważona Ef";
            voterReceived = "Wyborca ​​Otrzymał";
            totalValue = "Wartość Całkowita";
            mean = "Średnia";
            median = "Mediana";
            break;
        case 'ru':
            date = "Дата";
            efficiency = "Эффективность";
            weightedEff = "Взвешенная Эфф";
            voterReceived = "Избиратели Полученный";
            totalValue = "Общая стоимость";
            mean = "Среднее";
            median = "Медиана";
            break;
        case 'es':
            date = "Fecha";
            efficiency = "Eficiencia";
            weightedEff = "Ef Ponderada";
            voterReceived = "Votante Recibido";
            totalValue = "Valor Total";
            mean = "Media";
            median = "Mediana";
            break
        case 'uk':
            date = "Дата";
            efficiency = "Ефективність";
            weightedEff = "Зважена Еф";
            voterReceived = "Отримано виборця";
            totalValue = "Загальна вартість";
            mean = "Середній";
            median = "Медіана";
            break;
    }

    return {
        date,
        efficiency,
        weightedEff,
        voterReceived,
        totalValue,
        mean,
        median
    }
}

const getEfficiencyToggle = (user_lang) =>{
    let feather = "Efficiency (click for Weighted Efficiency)"
    let dumbbell = "Weighted Efficiency (click for Efficiency)"

    switch (user_lang){
        case 'fr':
            feather = "Efficacité (cliquer pour pondérée)";
            dumbbell = "Pondéré (cliquez pour Efficacité)";
            break;
        case 'it':
            feather = "Efficienza (clicca per Ponderato)";
            dumbbell = "Ponderato (clicca per Efficienza)";
            break;
        case 'ja':
            feather = "効率（クリックすると重み付けされます）";
            dumbbell = "加重（効率についてはクリック）";
            break;
        case 'ko':
            feather = "효율성(가중치를 보려면 클릭하세요)";
            dumbbell = "가중치 적용(효율성을 위해 클릭)";
        case 'pl':
            feather = "Efektywność (kliknij, aby zobaczyć Ważony)";
            dumbbell = "Ważony (kliknij, aby zobaczyć Efektywność)";
        case 'ru':
            feather = "Эффективность (нажмите, чтобы увидеть взвешенную)";
            dumbbell = "Взвешенный (нажмите, чтобы увидеть эффективность)";
        case 'es':
            feather = "Eficiencia (haga clic para Ponderado)";
            dumbbell = "Ponderado (haga clic para Eficiencia)";
        case 'uk':
            feather = "Ефективність (натисніть для Зважена)";
            dumbbell = "Зважена (натисніть для визначення Ефективність)";
    }

    return {
        feather,
        dumbbell
    }
}