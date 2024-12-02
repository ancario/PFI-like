import UserModel from '../models/user.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';
import Gmail from "../gmail.js";
export default class UserModelsController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new UserModel()));
    }
    register(){
        console.log("ALLLOOO")
    }
    sendVerificationEmail(user) {
       
        let html = `
                Bonjour ${user.Name}, <br /> <br />
                Voici votre code pour confirmer votre adresse de courriel
                <br />
                <h3>${user.VerifyCode}</h3>
            `;
        const gmail = new Gmail();
        gmail.send(user.Email, 'Vérification de courriel...', html);
    }

}