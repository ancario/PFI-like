import Model from './model.js';

export default class Like extends Model {
    constructor()
    {
        super(true);
      
        this.addField('IdPost','string');
        //list if Id integer
        this.addField('ListOfUserLike','object');

        this.setKey("IdPost");
    }

}