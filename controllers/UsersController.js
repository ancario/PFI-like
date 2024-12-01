import UserModel from '../models/user.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';

export default class UserModelsController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new UserModel()));
    }
}