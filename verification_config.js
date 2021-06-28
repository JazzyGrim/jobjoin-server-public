// Verification Configuration File

const eng_fields = {

    firstName: "First name",
    lastName: "Last Name",
    birthday: "Birthday",
    email: "Email",
    password: "Password",
    address: "Address",
    city: "City",
    state: "State",
    zip: "Postal Code",
    country: "Country",
    lat: "Latitude",
    long: "Longitude",
    companyName: "Company Name",
    pageFilter: "Page filter",
    jobTitle: "Job title",
    jobDescription: "Job description",
    jobDefaultResponse: "Default application response",
    jobSalary: "Salary",
    jobSalaryType: "Salary type",
    jobExperience: "Experience",
    jobEmploymentContract: "'Employment contract' filter",
    jobEmploymentTime: "'Employment time' filter",
    jobStudentsAccepted: "'Students accepted' filter",
    jobStartingDate: "Starting date",
    jobQuiz: "Quiz",
    jobQuizText: "Question",
    jobQuizType: "Question type",
    jobQuizTimeLimit: "Question time limit",
    jobQuizPoints: "Question points",
    jobQuizAnswers: "Question answers",
    jobQuizAnswerValue: "Question answer",
    jobQuizAnswerCorrect: "Answer correct",
    jobQuizRequired: 'Quiz required setting',
    quizAnswers: "Quiz answers",
    hourlyRate: "Hourly",
    monthlyRate: "Monthly",
    notRequired: "Not Required",
    required: "Required",
    partTime: "Part Time",
    fullTime: "Full Time",
    permanent: "Permanent",
    temporary: "Temporary",
    notAccepted: "Not Accepted",
    accepted: "Accepted",
    jobID: "Job ID",
    status: "Status",
    perPage: "Per page filter",
    recruiterID: "Recruiter ID",
    onlyPending: "Only Pending Applications",
    onlyShortlisted: "Only Shortlisted Applications",
    onlyDenied: "Only Denied Applications",
    reportReason: "Report reason",
    bugInfo: "Bug Info",
    searchTitle: "Search title",
    searchGTE: "Greater than filter",
    searchLTE: "Less that filter",
    searchOffset: "Offset filter",
    searchScale: "Scale filter",
    searchSalaryType: "Salary type filter",
    searchSalaryOrigin: "Salary origin filter",
    searchSalaryOffset: "Salary offset filter",
    searchSalaryScale: "Salary scale filter",
    jobType: "Job Type filter",
    experience: "Number of experiences",
    experienceType: "Experience type",
    experienceAmount: "Experience amount",
    experienceTitle: "Experience title",
    experienceDescription: "Experience description",
    education: "Number of educations",
    educationCountry: "Education country",
    educationSchool: "School",
    educationTitle: "Title",
    educationMajor: "Major",
    educationGraduationYear: "Graduation year",
    languages: "Number of languages",
    languagesName: "Name",
    languagesLevel: "Level"
}

const hrv_fields = {

    firstName: "Ime",
    lastName: "Prezime",
    birthday: "Datum rođenja",
    email: "Email",
    password: "Lozinka",
    address: "Adresa",
    city: "Grad",
    state: "Županija",
    zip: "Poštanski broj",
    country: "Država",
    lat: "Latituda",
    long: "Longituda",
    companyName: "Ime firme",
    pageFilter: "Filter stranice",
    jobTitle: "Naziv oglasa",
    jobDescription: "Opis oglasa",
    jobDefaultResponse: "Automatski odgovor na prijavu",
    jobSalary: "Plaća",
    jobSalaryType: "Vrsta plaće",
    jobExperience: "Radno iskustvo",
    jobEmploymentContract: "Radno vrijeme",
    jobEmploymentTime: "Filter 'pozicija'",
    jobStudentsAccepted: "Filter 'studenti prihvaćeni'",
    jobStartingDate: "Početak rada",
    jobQuiz: "Upitnik",
    jobQuizText: "Pitanje",
    jobQuizType: "Vrsta odgovora",
    jobQuizTimeLimit: "Vremensko ograničenje",
    jobQuizPoints: "Broj bodova",
    jobQuizAnswers: "Odgovori",
    jobQuizAnswerValue: "Odgovor",
    jobQuizAnswerCorrect: "Točnost odgovora",
    jobQuizRequired: 'Potrebnost upitnika',
    quizAnswers: "Odgovori upitnika",
    hourlyRate: "Po satu",
    monthlyRate: "Mjesečno",
    notRequired: "Nepotrebno",
    required: "Potrebno",
    partTime: "Nepuno Radno Vrijeme",
    fullTime: "Puno radno vrijeme",
    permanent: "Trajno radno mjesto",
    temporary: "Privremeno radno mjesto",
    notAccepted: "Nepoželjni",
    accepted: "Prihvaćeni",
    jobID: "Ključ posla",
    status: "Status",
    perPage: "Filter 'po stranici'",
    recruiterID: "Ključ poslodavca",
    onlyPending: "Samo aktivne prijave",
    onlyShortlisted: "Samo prijave u užem odabiru",
    onlyDenied: "Samo odbijene prijave",
    reportReason: "Razlog prijave",
    bugInfo: "Opis greške",
    searchTitle: "Naslov pretraživanja",
    searchGTE: "Filter 'više od'",
    searchLTE: "Filter 'manje od'",
    searchOffset: "Filter 'optimalna udaljenost'",
    searchScale: "Filter 'najveća udaljenost'",
    searchSalaryType: "Filter 'vrsta plaće'",
    searchSalaryOrigin: "Filter 'srednja plaća'",
    searchSalaryOffset: "Filter 'odstupanje od srednje plaće'",
    searchSalaryScale: "Filter 'maksimalno odstupanje od srednje plaće'",
    jobType: "Filter 'vrsta posla'",
    experience: "Broj radnih iskustva",
    experienceType: "Vrsta radnog iskustva",
    experienceAmount: "Količina radnog iskustva",
    experienceTitle: "Titula",
    experienceDescription: "Opis randog iskustva",
    education: "Broj edukacija",
    educationCountry: "Država edukacije",
    educationSchool: "Škola",
    educationTitle: "Titula",
    educationMajor: "Smjer",
    educationGraduationYear: "Godina završetka",
    languages: "Broj jezika",
    languagesName: "Ime jezika",
    languagesLevel: "Razina znanja"

}

const fields = {
    eng: eng_fields,
    hrv: hrv_fields
}

const eng_functions = {
    required: ( field ) => {
        return `${ fields[ 'eng' ][ field ] } is required.`
    },
    alpha: ( field ) => {
        return `${ fields[ 'eng' ][ field ] } can only contain letters.`
    },
    length: ( field, min, max ) => {
        return `${ fields[ 'eng' ][ field ] } has to contain at least ${min} characters and a maximum of ${max} characters.`
    },
    between: ( field, min, max ) => {
        return `${ fields[ 'eng' ][ field ] } must be between ${min} and ${max}.`
    },
    alphanumeric: ( field ) => {
        return `${ fields[ 'eng' ][ field ] } can only contain letters and numbers.`
    },
    numeric: ( field ) => {
        return `${ fields[ 'eng' ][ field ] } has to be a valid number.`
    },
    not_valid: ( field ) => {
        return `${ fields[ 'eng' ][ field ] } is not valid.`
    },
    alpha_and_spaces: ( field ) => {
        return `${ fields[ 'eng' ][ field ] } can only contain letters and spaces.`
    },
    future_date: ( field ) => {
        return `${ fields[ 'eng' ][ field ] } must be in the future.`
    },
    zero_or_one: ( field, zero, one ) => {
        return `${ fields[ 'eng' ][ field ] } must be either 0 ( ${ fields[ 'eng' ][ zero ] } ) or 1 ( ${ fields[ 'eng' ][ one ] } ).`
    },
    zero_or_one_or_two: ( field, zero, one, two ) => {
        return `${ fields[ 'eng' ][ field ] } must be either 0 ( ${ fields[ 'eng' ][ zero ] } ) or 1 ( ${ fields[ 'eng' ][ one ] } ) or 2 ( ${ fields[ 'eng' ][ two ] } ).`
    },
    gte: ( field, value ) => {
        return `${ fields[ 'eng' ][ field ] } must be greater than ${ value }.`
    },
    lte: ( field, value ) => {
        return `${ fields[ 'eng' ][ field ] } must be lower than ${ value }.`
    },
    boolean: ( field ) => {
        return `${ fields[ 'eng' ][ field ] } must be true or false.`
    },
}

const hrv_functions = {
    required: ( field ) => {
        return `${ fields[ 'hrv' ][ field ] } je obavezno polje.`
    },
    alpha: ( field ) => {
        return `${ fields[ 'hrv' ][ field ] } može sadržavati samo slova.`
    },
    length: ( field, min, max ) => {
        return `${ fields[ 'hrv' ][ field ] } mora imati minimalno ${min} i maksimalno ${max} znakova.`
    },
    between: ( field, min, max ) => {
        return `${ fields[ 'hrv' ][ field ] } mora biti između ${min} i ${max}.`
    },
    alphanumeric: ( field ) => {
        return `${ fields[ 'hrv' ][ field ] } može sadržavati samo slova i brojeve.`
    },
    numeric: ( field ) => {
        return `${ fields[ 'hrv' ][ field ] } mora biti validan broj.`
    },
    not_valid: ( field ) => {
        return `${ fields[ 'hrv' ][ field ] } nije validan.`
    },
    alpha_and_spaces: ( field ) => {
        return `${ fields[ 'hrv' ][ field ] } može sadržavati samo slova i razmake.`
    },
    future_date: ( field ) => {
        return `${ fields[ 'hrv' ][ field ] } mora biti u budućnosti.`
    },
    zero_or_one: ( field, zero, one ) => {
        return `${ fields[ 'hrv' ][ field ] } mora biti 0 ( ${ fields[ 'hrv' ][ zero ] } ) ili 1 ( ${ fields[ 'hrv' ][ one ] } ).`
    },
    zero_or_one_or_two: ( field, zero, one, two ) => {
        return `${ fields[ 'hrv' ][ field ] } mora biti 0 ( ${ fields[ 'hrv' ][ zero ] } ) ili 1 ( ${ fields[ 'hrv' ][ one ] } ) ili 2 ( ${ fields[ 'hrv' ][ two ] } ).`
    },
    gte: ( field, value ) => {
        return `${ fields[ 'hrv' ][ field ] } mora biti veće od ${ value }.`
    },
    lte: ( field, value ) => {
        return `${ fields[ 'hrv' ][ field ] } mora biti manje od ${ value }.`
    },
    boolean: ( field ) => {
        return `${ fields[ 'hrv' ][ field ] } mora biti točna ili netočna.`
    }
}

const functions = {
    eng: eng_functions,
    hrv: hrv_functions
}

module.exports = functions[ 'hrv' ]; // Export the verification message list