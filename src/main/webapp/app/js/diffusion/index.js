/*
 * Copyright (C) 2017 Push Technology Ltd.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */


const app = require('angular').module('racing');

const diffusion = require('diffusion');

app.factory('Diffusion', ['$state', ($state) => {
    const Diffusion = {
        sess: null,
    };

    Diffusion.connect = (properties, done) => {
        diffusion.connect({
            host: properties.host,
            port: properties.port,
            principal: 'client',
            credentials: properties.credentials,
        }).then((session) => {
            Diffusion.sess = session;
            done();
        });
    };

    Diffusion.session = () => {
        if (!Diffusion.sess || !Diffusion.sess.isConnected()) {
            $state.go('connecting');
            return false;
        }
        return Diffusion.sess;
    };

    Diffusion.datatypes = diffusion.datatypes;

    return Diffusion;
}]);
