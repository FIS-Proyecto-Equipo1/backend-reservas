const urljoin = require('url-join')
const request = require('request-promise-native').defaults({json: true})


class ViajesResource {
    static STATUS_EN_CURSO = "EN CURSO"
    
    static viajesUrl(resourceUrl) {
        const viajesServer = (process.env.VEHICULOS_URL || 'https://microservice-travel.herokuapp.com/');
        return urljoin(viajesServer, resourceUrl);
    }


    static requestHeaders() {
        return {
            "x-role": "ADMIN",
            "rol": "ADMIN"
        };
    }


    static postViaje(idCliente, idVehiculo) {
        console.log("postViaje " + idCliente + " " + idVehiculo)
        const url = ViajesResource.viajesUrl("/api/v1/travels/");

        var viaje = {
            id_cliente: ""+idCliente,
            id_vehiculo: idVehiculo,
            estado: this.STATUS_EN_CURSO,
            duracion: "0"
        }

        console.log(viaje)
        const options = {
            headers: ViajesResource.requestHeaders(),
            body: viaje
        }

        

        return request.post(url, options);
    }
}


module.exports = ViajesResource;