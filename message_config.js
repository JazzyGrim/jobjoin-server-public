// Message Configuration File

const eng = {

    error: {
        query: {
            must_specify: "You must specify a proper query."
        },
        email: {
            not_provided: 'You must provide an email address.',
            taken: 'The email you provided is taken.',
            already_verified: 'You have already verified your email.'
        },
        user: {
            doesnt_exist: 'User does not exist!',
            already_banned: 'User has already been banned.',
            no_image: 'This user does not have an image!',
            banned: 'This user has been banned.',
            deleted: 'This user account has been deleted.',
            already_reported: 'You already reported this user.'
        },
        recruiter: {
            doesnt_exist: 'Recruiter does not exist!',
            already_banned: 'Recruiter has already been banned.',
            no_image: 'This recruiter does not have an image!',
            no_jobs: 'You didn\'t post any jobs.',
            deleted: 'This recruiter account has been deleted.',
            banned: 'This recruiter has been banned.',
            already_reported: 'You already reported this recruiter.'
        },
        job: {
            doesnt_exist: 'Job does not exist!',
            not_the_creator: 'You are not the creator of this job.',
            state_already_set: 'You already set the state of this job to taken.',
            cancelled: 'This job has been cancelled.',
            already_applied: 'You have already applied for this job!',
            already_saved: 'You have already saved this job!',
            not_saved: 'You did not save this job!',
            already_cancelled: 'You already cancelled this job.',
            no_image: 'This job does not have an image!',
            created_without_quiz: 'The job was created but an error occured while creating the quiz.'
        },
        job_type: {
            doesnt_exist: 'Target Job Type doesn\'t exist.'
        },
        quiz: {
            doesnt_exist: 'Quiz does not exist!',
            not_solved: 'The user didn\'t fill out the quiz.',
        },
        chat: {
            no_permission: 'You don\'t have permission to be in this chat.'
        },
        chat_unlocks: {
            none_found: 'No chat unlocks found.',
            already_unlocked: 'You have already unlocked chat width this user!'
        },
        user_type: {
            unknown: "Unknown user type.",
            unkown_account_type: "The account type you specified is not valid."
        },
        verification: {
            unauthorized: "Un-authorized verification attempt."
        },
        push_token: {
            only_users: "Only users have access to the notification feature."
        },
        facebook: {
            use_facebook_reset: "It looks like you used Facebook to register. Visit www.facebook.com to reset your Facebook password.",
            use_facebook_login: "It looks like you used Facebook to register. Please log in using Facebook.",
            account_doesnt_exist: "An account with this Facebook ID does not exist. Please provide location info for your new account.",
            provide_address: "Please provide an address to finish the sign up process."
        },
        access: {
            recruiter_only: 'Only recruiters are allowed to access this page.',
            user_only: 'Only users are allowed to access this page.'
        },
        account: {
            already_exists: "You already have an account. Use your e-mail and password to login.",
            suspended: 'Your account has been permanently suspended.',
            wrong_account: "The Facebook account you are using is not associated with this account.",
            logged_on_another_device: 'You are logged in on another device.'
        },
        password: {
            incorrect: 'The password is incorrect!'
        },
        application: {
            doesnt_exist: 'The application doesn\'t exist.',
            already_denied: 'The application has already been denied.',
            expired: 'The application has expired.'
        },
        credits: {
            not_enough_for_chat_offer: 'You don\'t have enough credits to unlock chat. Please purchase more to continue.'
        },
        access_token: {
            invalid_source: "Your access token is not from a valid source.",
            invalid_token: "Your access token is not valid."
        },
        image: {
            too_large: 'Image is too large. Maximum file size is 5 MB.'
        },
        token: {
            failed_to_authenticate: 'Failed to authenticate token.',
            required: 'You must provide a token to use our services.'
        },
        product: {
            unkown: 'Unknown product specified.'
        },
        unknown: "An unexpected error occured.",
        overloaded: "The site is experiencing very high usage. Please try again."
    },
    
    success: {
        report: {
            submitted: 'Report Submitted.'
        },
        bug: {
            submitted: 'Bug submitted.'
        },
        chat_unlocks: {
            unlocked: 'You successfully unlocked chat with the user.'
        },
        application: {
            denied: 'You denied the application.',
            shortlisted: 'You shortlisted the application.',
            un_shortlisted: 'You removed the application from your shortlist.'
        },
        email: {
            available: 'The email you provided is available.'
        },
        user: {
            banned: 'User successfully banned.',
            updated: 'User successfully updated.',
            image_uploaded: 'Your image has been successfully uploaded.',
            image_deleted: 'Your image has been successfully deleted.',
            about_updated: 'User\'s about has been updated.',
            experience_updated: 'User experience successfully updated.',
            education_updated: 'User education successfully updated.',
            languages_updated: 'User languages successfully updated.'
        },
        recruiter: {
            banned: 'Recruiter successfully banned.',
            image_uploaded: 'Your image has been successfully uploaded.',
            image_deleted: 'Your image has been successfully deleted.',
            updated: 'Recruiter successfully updated.'
        },
        job: {
            created: 'New Job Created.',
            status_set: 'You successfully set the job status as taken.',
            successfully_applied: 'You successfully applied for the job.',
            successfully_saved: 'You have successfully saved this job.',
            successfully_unsaved: 'You have successfully un-saved this job.',
            cancelled: 'Your job has been cancelled.',
            image_uploaded: 'Your job image has been successfully uploaded.',
            image_deleted: 'Job image has been successfully deleted.',
            quiz_updated: 'Quiz updated.',
            response_updated: 'Application response updated.'
        },
        job_type: {
            created: 'New Job Type Created.',
            user_updated: 'User\'s job type has been updated.'
        },
        address: {
            updated: 'Address updated.'
        },
        verification_email: {
            sent: 'Verification email has been sent.'
        },
        push_token: {
            set: "Notification token set."
        },
        account: {
            delete_confirmation: 'Please click the link in your email to proceed with the account deletion process.',
            reset_email_sent: 'We sent you an email. Click the link in the email to reset your password.'
        },
        purchase: {
            successful: 'Purchase successful!'
        }
    }

}

const hrv = {

    error: {
        query: {
            must_specify: "Morate specificirati pravilne opcije zahtjeva."
        },
        email: {
            not_provided: 'Morate specificirati email adresu.',
            taken: 'Email adresa je zauzeta.',
            already_verified: 'Vaša email adresa već je potvrđena.'
        },
        user: {
            doesnt_exist: 'Korisnik ne postoji!',
            already_banned: 'Korisnik već ima zabranu pristupa aplikaciji.',
            no_image: 'Korisnik nema profilnu sliku!',
            banned: 'Ovaj korisnik je uklonjen s platforme.',
            deleted: 'Ovaj korisnički račun je izbrisan.',
            already_reported: 'Već ste prijavili ovog korisnika.'
        },
        recruiter: {
            doesnt_exist: 'Poslodavac ne postoji!',
            already_banned: 'Poslodavac već ima zabranu pristupa aplikaciji.',
            no_image: 'Poslodavac nema profilnu sliku!',
            no_jobs: 'Niste objavili niti jedan posao.',
            deleted: 'Ovaj račun poslodavca je izbrisan.',
            banned: 'Ovaj poslodavac je uklonjen s platforme.',
            already_reported: 'Već ste prijavili ovog poslodavca.'
        },
        job: {
            doesnt_exist: 'Oglas ne postoji!',
            not_the_creator: 'Niste vlasnik ovog oglasa.',
            state_already_set: 'Već ste označili radno mjesto kao zauzeto.',
            cancelled: 'Ovaj oglas je otkazan.',
            already_applied: 'Već ste se prijavili na ovaj posao!',
            already_saved: 'Već ste spremili ovaj oglas!',
            not_saved: 'Niste spremili ovaj oglas!',
            already_cancelled: 'Već ste otkazali ovaj oglas.',
            no_image: 'Ovaj oglas nema sliku!',
            created_without_quiz: 'Oglas je objavljen no došlo je do pogreške pri stvaranju upitnika.',
            response_updated: 'Automatski odgovor na prijave je spremljen.'
        },
        job_type: {
            doesnt_exist: 'Traženi posao ne postoji.'
        },
        quiz: {
            doesnt_exist: 'Upitnik ne postoji.',
            not_solved: 'Korisnik nije ispunio upitnik.',
        },
        chat: {
            no_permission: 'Ovaj razgovor nije otključan.'
        },
        chat_unlocks: {
            none_found: 'Nema pronađenih otključanih razgovora.',
            already_unlocked: 'Već ste oključali razgovor s ovim korisnikom!'
        },
        user_type: {
            unknown: "Nepoznata vrsta računa.",
            unkown_account_type: "Vrsta računa koju ste specificirali ne postoji."
        },
        verification: {
            unauthorized: "Neovlašten pokušaj verifikacije."
        },
        push_token: {
            only_users: "Samo korisnici trenutno imaju mogućnost notifikacija."
        },
        facebook: {
            use_facebook_reset: "Vaš račun registriran je Facebook-om. Posjetite www.facebook.com da promijenite lozinku.",
            use_facebook_login: "Vaš račun registriran je Facebook-om. Koristite Facebook za prijavu.",
            account_doesnt_exist: "Račun s ovim Facebook računom ne postoji.",
            provide_address: "Molimo postavite adresu za nastavak s registracijom."
        },
        access: {
            recruiter_only: 'Samo poslodavci imaju pristup ovoj stranici.',
            user_only: 'Samo korisnici imaju pristup ovoj stranici.'
        },
        account: {
            already_exists: "Račun već postoji. Koristite vašu email adresu i lozinku za prijavu.",
            suspended: 'Vaš račun je trajno uklonjen s platforme.',
            wrong_account: "Facebook račun koji koristite nije povezan s ovim računom.",
            logged_on_another_device: 'Prijavljeni ste na drugom uređaju.'
        },
        password: {
            incorrect: 'Lozinka je netočna!'
        },
        application: {
            doesnt_exist: 'Prijava ne postoji.',
            already_denied: 'Prijava je već odbijena.',
            expired: 'Prijava je istekla.'
        },
        credits: {
            not_enough_for_chat_offer: 'Nemate dovoljno kredita za otključati razgovor. Molimo nadoplatite Vaš račun da nastavite.'
        },
        access_token: {
            invalid_source: "Pristupni token nije iz validnog izvora.",
            invalid_token: "Pristupni token nije validan."
        },
        image: {
            too_large: 'Slika nesmije biti veća od 5 MB.'
        },
        token: {
            failed_to_authenticate: 'Pogreška u verifikaciji tokena.',
            required: 'Morate specificirati token za korištenje platforme.'
        },
        product: {
            unkown: 'Specificiran je nepoznati artikl.'
        },
        unknown: "Dogodio se nepoznati problem.",
        overloaded: "Zbog velike potražnje platforma je usporena. Molimo pokušajte ponovo."
    },
    
    success: {
        report: {
            submitted: 'Prijava prijavljena.'
        },
        bug: {
            submitted: 'Greška prijavljena.'
        },
        chat_unlocks: {
            unlocked: 'Uspješno ste otključali razgovor s korisnikom.'
        },
        application: {
            denied: 'Odbili ste prijavu.',
            shortlisted: 'Prijava je dodana u uži izbor.',
            un_shortlisted: 'Prijava je maknuta iz užeg izbora.'
        },
        email: {
            available: 'Email adresa je dostupna.'
        },
        user: {
            banned: 'Korisnik uspješno uklonjen.',
            updated: 'Korisnik uspješno ažuriran.',
            image_uploaded: 'Vaša slika je uspješno postavljena.',
            image_deleted: 'Vaša slika je uspješno izbrisana.',
            about_updated: 'Opis uspješno ažuriran.',
            experience_updated: 'Iskustvo uspješno ažurirano.',
            education_updated: 'Edukacija uspješno ažurirana.',
            languages_updated: 'Jezici uspješno ažurirani.'
        },
        recruiter: {
            banned: 'Poslodavac uspješno uklonjen.',
            image_uploaded: 'Vaša slika je uspješno postavljena.',
            image_deleted: 'Vaša slika je uspješno izbrisana.',
            updated: 'Poslodavac uspješno ažuriran.'
        },
        job: {
            created: 'Novi oglas objavljen.',
            status_set: 'Radno mjesto je označeno kao zauzeto.',
            successfully_applied: 'Uspješno ste se prijavili na posao.',
            successfully_saved: 'Posao spremljen.',
            successfully_unsaved: 'Posao uklonjen.',
            cancelled: 'Oglas uspješno otkazan.',
            image_uploaded: 'Slika oglasa je uspješno postavljena.',
            image_deleted: 'Slika oglasa je uspješno uklonjena.',
            quiz_updated: 'Upitnik je spremljen.'
        },
        job_type: {
            created: 'Nova kategorija posla dodana.',
            user_updated: 'Traženi posao uspješno ažuriran.'
        },
        address: {
            updated: 'Adresa ažurirana.'
        },
        verification_email: {
            sent: 'Email za potvrdu je poslan.'
        },
        push_token: {
            set: "Token za notifikacije postavljen."
        },
        account: {
            delete_confirmation: 'Molimo otvorite link na Vašem emailu za nastavak s brisanjem računa.',
            reset_email_sent: 'Poslali smo Vam mail. Otvorite link u mailu da postavite novu lozinku.'
        },
        purchase: {
            successful: 'Kupovina uspješna!'
        }
    }

}

const messages = {
    eng,
    hrv
}

module.exports = messages[ 'hrv' ]; // Export the message list