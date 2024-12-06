
class Accounts_API {
    static API_URL() { return "http://localhost:5000/accounts" };
    static Token_URL() { return "http://localhost:5000/token" };
    static initHttpState() {
        this.currentHttpError = "";
        this.currentStatus = 0;
        this.error = false;
    }
    static setHttpErrorState(xhr) {
        if (xhr.responseJSON)
            this.currentHttpError = xhr.responseJSON.error_description;
        else
            this.currentHttpError = xhr.statusText == 'error' ? "Service introuvable" : xhr.statusText;
        this.currentStatus = xhr.status;
        this.error = true;
    }
    static async HEAD() {
        Accounts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL(),
                type: 'HEAD',
                contentType: 'text/plain',
                complete: data => { resolve(data.getResponseHeader('ETag')); },
                error: (xhr) => { Accounts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Get(id = null) {
        Accounts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + (id != null ? "/" + id : ""),
                complete: data => { resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON }); },
                error: (xhr) => { Accounts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async GetQuery(queryString = "") {
        Accounts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + queryString,
                complete: data => {
                    resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON });
                },
                error: (xhr) => {
                    Accounts_API.setHttpErrorState(xhr); resolve(null);
                }
            });
        });
    }
    static async Save(data, create = true) {
        Accounts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: create ? this.API_URL() : this.API_URL() + "/" + data.Id,
                type: create ? "POST" : "PUT",
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: (data) => { resolve(data); },
                error: (xhr) => { Accounts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Delete(id) {
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + "/" + id,
                type: "DELETE",
                complete: () => {
                    Accounts_API.initHttpState();
                    resolve(true);
                },
                error: (xhr) => {
                    Accounts_API.setHttpErrorState(xhr); resolve(null);
                }
            });
        });
    }
    static async Login(loginInfo) {
        Accounts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.Token_URL() ,
                type: "POST",
                contentType: 'application/json',
                data: JSON.stringify(loginInfo),
                success: (data) => { 
                    resolve(data); 
                },
                error: (xhr) => {
                    Accounts_API.setHttpErrorState(xhr); 
                    resolve(null);
                }
            });
        });
    }

    // static USER_KEY = "users";
    // static TOKEN_KEY = "tokens";
    //   // Sauvegarde d'un utilisateur dans sessionStorage
    //   static async SaveUser(user) {
    //     return new Promise((resolve) => {
    //         if (!user || !user.Email) {
    //             console.error("L'utilisateur doit avoir un email valide.");
    //             resolve(false);
    //         } else {
    //             const users = JSON.parse(sessionStorage.getItem(this.USER_KEY)) || {};
    //             users[user.Email] = user; // Ajoute ou met à jour l'utilisateur
    //             sessionStorage.setItem(this.USER_KEY, JSON.stringify(users));
    //             console.log(`Utilisateur sauvegardé : ${user.Email}`);
    //             resolve(true);
    //         }
    //     });
    // }

    // // Sauvegarde d'un token dans sessionStorage
    // static async SaveToken(email, token) {
    //     return new Promise((resolve) => {
    //         if (!email || !token) {
    //             console.error("Un email et un token valides sont nécessaires.");
    //             resolve(false);
    //         } else {
    //             const tokens = JSON.parse(sessionStorage.getItem(this.TOKEN_KEY)) || {};
    //             tokens[email] = token; // Ajoute ou met à jour le token
    //             sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
    //             console.log(`Token sauvegardé pour ${email}`);
    //             resolve(true);
    //         }
    //     });
    // }
    static USER_KEY = "user";
static TOKEN_KEY = "token";

// Sauvegarde d'un utilisateur dans sessionStorage
static async SaveUser(user) {
    return new Promise((resolve) => {
        if (!user || !user.Email) {
            console.error("L'utilisateur doit avoir un email valide.");
            resolve(false);
        } else {
            sessionStorage.setItem(this.USER_KEY, JSON.stringify(user)); // Stocke directement l'utilisateur
            console.log(`Utilisateur sauvegardé : ${user.Email}`);
            resolve(true);
        }
    });
}

// Sauvegarde d'un token dans sessionStorage
static async SaveToken(token) {
    return new Promise((resolve) => {
        if (!token) {
            console.error("Un token valide est nécessaire.");
            resolve(false);
        } else {
            sessionStorage.setItem(this.TOKEN_KEY, token); // Stocke directement le token
            console.log("Token sauvegardé.");
            resolve(true);
        }
    });
}
}