var products = [];
var productsLoad = false;

function findProduct(productId) {
    return (products && products.length && products.hasOwnProperty(findProductKey(productId))) ? products[findProductKey(productId)] : null;
}

function findProductKey(productId) {
    if (products && products.length) {
        for (var key = 0; key < products.length; key++) {
            if (products[key].id == productId) {
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

var List = Vue.extend({
    template: '#product-list',
    data: function () {
        return {products: products, searchKey: ''};
    },
    created: function () {
        this.fetchActivities();
    },

    methods: {
        fetchActivities: function () {
            var self = this;
            if (!productsLoad) {
                this.$http.get('/v1/list/image.json').then(function (response) {
                    products = response.body;
                    self.products = response.body;
                    productsLoad = true;

                }, function (response) {
                    console.error(response);
                });
            }
        }
    }
});

var Product = Vue.extend({
    template: '#product',
    data: function () {
        return {product: findProduct(this.$route.params.product_id)};
    }
});

var ProductEdit = Vue.extend({
    template: '#product-edit',
    data: function () {
        return {
            check_data: {login: '', password: '', new_login: '', new_password: ''},
            isCheck: false,
            error: null,
            product: null
        };
    },
    methods: {
        checkData: function (e) {
            e.preventDefault();
            var product_id = this.$route.params.product_id;
            var self = this;
            this.$http.get('/v1/images/' + product_id + '.json', {
                params: {
                    login: this.check_data.login,
                    password: this.check_data.password
                }
            }).then(function (response) {
                self.product = response.body;
                self.isCheck = true;
                self.error = null;

            }, function (response) {
                console.error(response);
                self.error = response.status;
            });
        },
        updateProduct: function (e) {
            e.preventDefault();
            var product = this.product;
            var key = findProductKey(product.id);
            products[key] = {
                id: product.id,
                name: product.name,
                login: (product.new_login && product.new_login.length) ? product.new_login : product.login,
                password: (product.new_password && product.new_password.length) ? product.new_password : product.password
            };

            var canvas = document.getElementById("canvas-body");
            var canvasData = canvas.toDataURL("image/png");

            var formData = new FormData();
            formData.append('name', product.name);
            formData.append('login', (product.login && product.login.length) ? product.login : '');
            formData.append('password', (product.password && product.password.length) ? product.password : '');
            formData.append('new_login', (product.new_login && product.new_login.length) ? product.new_login : '');
            formData.append('new_password', (product.new_password && product.new_password.length) ? product.new_password : '');
            formData.append('file', dataURItoBlob(canvasData));

            this.$http.post('/v1/updates/' + product.id + '/images.json', formData).then(function (response) {
                var updateProduct = response.body;
                var key = findProductKey(updateProduct.id);
                products[key]['name'] = updateProduct.name;

                router.push('/');
            }, function (response) {
                console.error(response)
            });
        }
    }
});

var AddProduct = Vue.extend({
    template: '#add-product',
    data: function () {
        return {
            product: {name: '', login: '', password: ''}
        }
    },
    methods: {
        createProduct: function (e) {
            e.preventDefault();
            var product = this.product;
            var canvas = document.getElementById("canvas-body");
            var canvasData = canvas.toDataURL("image/png");

            var formData = new FormData();
            formData.append('name', product.name);
            formData.append('login', (product.login && product.login.length) ? product.login : '');
            formData.append('password', (product.password && product.password.length) ? product.password : '');
            formData.append('file', dataURItoBlob(canvasData));

            this.$http.post('/v1/images.json', formData).then(function (response) {
                var newProduct = response.body;

                products.push(newProduct);
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
        {path: '/', component: List, name: 'home'},
        {path: '/product/add', component: AddProduct, name: 'product-add'},
        {path: '/product/:product_id/edit', component: ProductEdit, name: 'product-edit'}
    ]
});

var vm = new Vue({
    el: '#app',
    router: router,
    template: '<router-view></router-view>'
});
