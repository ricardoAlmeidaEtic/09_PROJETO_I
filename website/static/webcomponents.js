/**TODO HEADER */
const itemTemplate = document.createElement("template");
itemTemplate.innerHTML = `
<style>
    .drive-item {
        display: flex;
        align-items: center;
        border-bottom: 1px solid #ddd;
        padding: 10px;
        cursor: pointer;
    }

    .drive-item a{
        display: flex;
        align-items: center;
        text-decoration: none; 
        color:black;
    }

    .drive-item:hover{
        background-color: lightgray;
    }

    .drive-item-icon {
        width: 40px;
        height: 40px;
        background-color: #eee;
        margin-right: 10px;
    }

    .drive-item-icon img{
        width: 100%;
    }

    .drive-item-details {
        flex: 1;
    }

    .drive-item-name {
        font-weight: bold;
    }

    .drive-item-date {
        color: #666;
    }

    .dive-item-delete{
        background: red;
    }
</style>

<li class="drive-item">
    <a id="drive-link" style="width: 100%;">
        <div class="drive-item-icon">
            <img>
        </div>
        <div class="drive-item-details">
            <span class="drive-item-name"></span>
            <span class="drive-item-date"></span>
        </div>
        <a id="delete">
            <div class="drive-item-icon dive-item-delete">
                <img src="https://cdn.iconscout.com/icon/free/png-256/free-trash-1767922-1502175.png">
            </div>
        </a>
    </a>
</li>

`;

class Folder extends HTMLElement {

    static observedAttributes = ['id','name','type','date'];
    shadowRoot;
    #folder;
    #id = null;
    #name  = null;
    #type  = null;
    #date  = null;

    constructor() {
        super();
        this.shadowRoot = this.attachShadow({mode: 'closed'});
        this.shadowRoot.appendChild(itemTemplate.content.cloneNode(true));
        this.#folder = this.shadowRoot.querySelector("#drive-item");
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        switch (attrName) {
            case 'id':
                this.#id = newVal
                break
            case 'name':
                this.#name = newVal
                break
            case 'type':
                this.#type = newVal
                break
            case 'date':
                this.#date = newVal
                break
        }

        this.render()
    }

    render(){
        const driveLink = this.shadowRoot.querySelector("#drive-link");
        const driveItemIcon = this.shadowRoot.querySelector(".drive-item-icon");
        const driveItemDetails = this.shadowRoot.querySelector(".drive-item-details");
        const driveItemDelete = this.shadowRoot.querySelector("#delete");

        driveLink.href=`/website/${this.#id}`

        if(this.#type == 1)
            driveItemIcon.children[0].src = "https://cdn.iconscout.com/icon/free/png-256/free-folder-1166-470303.png"
        else
            driveItemIcon.children[0].src = "https://cdn.iconscout.com/icon/free/png-256/free-vlc-media-player-3-735027.png"

        driveItemDetails.children[0].innerText = this.#name
        driveItemDetails.children[1].innerText = this.#date

        driveItemDelete.onclick = () => this.delete(this,this.#id,this.#type);
    }

    delete(element,id,type){
        let typeText = type === 1 ? "Folder" : "File";

        if (confirm(`Are you sure you want to delete this ${typeText}?`)) {
            element.style.display="none"
            alert(`The ${typeText} was deleted!`);
        }
    }
}
customElements.define("new-element", Folder);