var images = [];
var imagesLoad = false;

function findImage(imageId) {
    return (images && images.length && images.hasOwnProperty(findImageKey(imageId))) ? images[findImageKey(imageId)] : null;
}

function findImageKey(imageId) {
    if (images && images.length) {
        for (var key = 0; key < images.length; key++) {
            if (images[key].id == imageId) {
                return key;
            }
        }
    }
}

function dataURItoBlob(dataURI) {
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0){
        byteString = atob(dataURI.split(',')[1]);
    } else {
        byteString = unescape(dataURI.split(',')[1]);
    }
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], {type:mimeString});
}

var ImageList = Vue.extend({
    template: '#image-list',
    data: function () {
        return {images: images, searchKey: ''};
    },
    created: function () {
        this.fetchActivities();
    },

    methods: {
        fetchActivities: function () {
            var self = this;
            if (!imagesLoad) {
                this.$http.get('/v1/list/image.json').then(function (response) {
                    images = response.body;
                    self.images = response.body;
                    imagesLoad = true;

                }, function (response) {
                    console.error(response);
                });
            }
        }
    }
});

var ImageEdit = Vue.extend({
    template: '#image-edit',
    data: function () {
        return {
            check_data: {login: '', password: '', new_login: '', new_password: ''},
            isCheck: false,
            error: null,
            image: null
        };
    },
    methods: {
        checkData: function (e) {
            e.preventDefault();
            var image_id = this.$route.params.image_id;
            var self = this;
            this.$http.get('/v1/images/' + image_id + '.json', {
                params: {
                    login: this.check_data.login,
                    password: this.check_data.password
                }
            }).then(function (response) {
                self.image = response.body;
                self.isCheck = true;
                self.error = null;

            }, function (response) {
                console.error(response);
                self.error = response.status;
            });
        },
        updateImage: function (e) {
            e.preventDefault();
            var image = this.image;
            var key = findImageKey(image.id);
            images[key] = {
                id: image.id,
                name: image.name,
                login: (image.new_login && image.new_login.length) ? image.new_login : image.login,
                password: (image.new_password && image.new_password.length) ? image.new_password : image.password
            };

            var canvas = document.getElementById("canvas-body");
            var canvasData = canvas.toDataURL("image/png");

            var formData = new FormData();
            formData.append('name', image.name);
            formData.append('login', (image.login && image.login.length) ? image.login : '');
            formData.append('password', (image.password && image.password.length) ? image.password : '');
            formData.append('new_login', (image.new_login && image.new_login.length) ? image.new_login : '');
            formData.append('new_password', (image.new_password && image.new_password.length) ? image.new_password : '');
            formData.append('file', dataURItoBlob(canvasData));

            this.$http.post('/v1/updates/' + image.id + '/images.json', formData).then(function (response) {
                var updateImage = response.body;
                var key = findImageKey(updateImage.id);
                images[key]['name'] = updateImage.name;

                router.push('/');
            }, function (response) {
                console.error(response)
            });
        }
    }
});

var ImageAdd = Vue.extend({
    template: '#image-add',
    data: function () {
        return {
            image: {name: '', login: '', password: ''}
        }
    },
    methods: {
        createImage: function (e) {
            e.preventDefault();
            var image = this.image;
            var canvas = document.getElementById("canvas-body");
            var canvasData = canvas.toDataURL("image/png");

            var formData = new FormData();
            formData.append('name', image.name);
            formData.append('login', (image.login && image.login.length) ? image.login : '');
            formData.append('password', (image.password && image.password.length) ? image.password : '');
            formData.append('file', dataURItoBlob(canvasData));

            this.$http.post('/v1/images.json', formData).then(function (response) {
                var newImage = response.body;

                images.push(newImage);
                router.push('/');
            }, function (response) {
                console.error(response)
            });
        }
    }
});

Vue.component('error-message-component', {
    template: '<div v-if="error_message" class="alert alert-danger" role="alert">{{ error_message }}</div>',
    props: ['error'],
    data: function () {
        return {
            error_message: null
        }
    },
    watch: {
        error: function () {
          if(this.error){
              switch (this.error){
                  case 400:
                      this.error_message = 'Поля формы содержат ошибку';
                      break;
                  case 403:
                      this.error_message = 'Отказ в доступе';
                      break;
                  default:
                      this.error_message = this.error;
              }
          } else {
              this.error_message = null;
          }
      }
    }
});

Vue.component('canvas-component', {
    template: '<canvas id="canvas-body" width="300" height="200" style="border:1px solid #000000;"></canvas>',
    props: ['oldCanvas'],
    mounted: function () {
        var canvas = document.getElementById("canvas-body");

        if (!canvas) {
            alert('Ошибка! Canvas элемент не найден!');
            return;
        }

        if (!canvas.getContext) {
            alert('Ошибка: canvas.getContext не существует!');
            return;
        }

        var context = canvas.getContext('2d');
        if (!context) {
            alert('Ошибка: getContext! не существует');
            return;
        }
        if (this.oldCanvas && this.oldCanvas.length) {
            var imageObj = new Image();
            imageObj.onload = function () {
                context.drawImage(imageObj, 0, 0);
            };
            imageObj.src = this.oldCanvas;
        }

        tool = new tool_pencil();
        canvas.addEventListener('mousedown', ev_canvas, false);
        canvas.addEventListener('mousemove', ev_canvas, false);
        canvas.addEventListener('mouseup', ev_canvas, false);

        function tool_pencil() {
            var tool = this;
            this.started = false;


            this.mousedown = function (ev) {
                context.beginPath();
                context.moveTo(ev._x, ev._y);
                tool.started = true;
            };

            this.mousemove = function (ev) {
                if (tool.started) {
                    context.lineTo(ev._x, ev._y);
                    context.stroke();
                }
            };

            this.mouseup = function (ev) {
                if (tool.started) {
                    tool.mousemove(ev);
                    tool.started = false;
                }
            };
        }

        function ev_canvas(ev) {
            if (ev.layerX || ev.layerX == 0) { // Firefox
                ev._x = ev.layerX;
                ev._y = ev.layerY;
            } else if (ev.offsetX || ev.offsetX == 0) { // Opera
                ev._x = ev.offsetX;
                ev._y = ev.offsetY;
            }

            var func = tool[ev.type];
            if (func) {
                func(ev);
            }
        }
    }
});

var router = new VueRouter({
    routes: [
        {path: '/', component: ImageList, name: 'home'},
        {path: '/image/add', component: ImageAdd, name: 'image-add'},
        {path: '/image/:image_id/edit', component: ImageEdit, name: 'image-edit'}
    ]
});

var vm = new Vue({
    el: '#app',
    router: router,
    template: '<router-view></router-view>'
});
