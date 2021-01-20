const urljoin = require('url-join')
const request = require('request-promise-native').defaults({json: true})


class UsuariosResource {
    static STATUS_DISPONIBLE = "DISPONIBLE"
    
    static usuariosUrl(resourceUrl) {
        const usuariosServer = (process.env.AUTENTICACION_URL || 'https://urbanio-autenticacion.herokuapp.com');
        return urljoin(usuariosServer, resourceUrl);
    }


    static requestHeaders() {
        return {};
    }

    static getUsuario(userId) {
        console.log("getUsuario " + userId)
        const url = UsuariosResource.usuariosUrl("/api/v1/user/" + userId);
        console.log(url)
        const options = {
            headers: UsuariosResource.requestHeaders()
        }
        return request.get(url, options);
    }
}


module.exports = UsuariosResource;