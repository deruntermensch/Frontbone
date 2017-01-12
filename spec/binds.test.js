/*globals describe, jasmine, expect, $, _, it, ViewModel, Observable*/
describe('ViewModel.binds', function () {
    "use strict";


    describe('standart', function () {

        describe('.html', function () {

            it('replaces innerHTML of HTMLElement the value of the bound model field', function () {

                var vm = Widget.create({
                    el: $.parse('<div data-bind="html: value"></div>'),
                    fields: {
                        value: '<span>Hello</span>'
                    }
                });


                expect(vm.el.innerHTML.toLowerCase()).toBe('<span>hello</span>');

                vm.prop('value', undefined);
                expect(vm.el.innerHTML).toBe('');

                vm.prop('value', false);
                expect(vm.el.innerHTML).toBe('');

                vm.prop('value', null);
                expect(vm.el.innerHTML).toBe('');

                vm.prop('value', 0);
                expect(vm.el.innerHTML).toBe('0');
            });


            it('supports filters', function () {

                var vm = Widget.create({
                    el: $.parse('<div data-bind="html: value | sumFilter:\'321\'"></div>'),
                    fields: {
                        value: 123
                    }
                });

                expect(vm.el.innerHTML).toBe('444');
            });
        });


        describe('.value', function () {

            it('binds observable to input value', function () {

                var vm = ViewModel.create({
                    el: '<input data-bind="value: value"/>',
                    autoParseBinds: true,
                    fields: {
                        value: 'Hello'
                    }
                });
                expect(vm.$el.val()).toBe('Hello');


                vm.prop('value', undefined);
                expect(vm.$el.val()).toBe('');

                vm.prop('value', false);
                expect(vm.$el.val()).toBe('');

                vm.prop('value', null);
                expect(vm.$el.val()).toBe('');

                vm.prop('value', 0);
                expect(vm.$el.val()).toBe('0');


                vm.$el.val('abc');
                vm.$el.trigger('keyup');
                expect(vm.prop('value')).toBe('abc');
            });
        });


        describe('.withModel', function () {
            it('draws model', function () {

                var Hero = Model.extend({
                    fields: {
                        name: ''
                    },
                    computeds: {
                        greet: {
                            deps: ['name'],
                            get: function (name) {
                                return 'My name is ' + name;
                            }
                        }
                    }
                });

                var superman = new Hero({
                    name: 'Superman'
                });

                var vm = ViewModel.create({
                    el: '<div><ul data-bind="withModel: hero"><li>{{name}} {{greet}}</li></ul></div>',
                    autoParseBinds: true,
                    fields: {
                        hero: superman
                    },
                    computeds: {
                    }
                });


                expect(vm.$el.find('li').html()).toBe('Superman My name is Superman');

                var batman = new Hero({
                    name: 'Batman'
                });

                vm.prop('hero', batman);

                expect(vm.$el.find('li').html()).toBe('Batman My name is Batman');

            });


        });

        describe('.eachModel', function () {
            it('draws collection', function () {


                var collection = new Collection([
                    {name: 'Vasya'},
                    {name: 'Petya'}
                ]);


                expect(collection.length).toBe(2);


                var vm = ViewModel.create({
                    el: '<div><ul data-bind="eachModel: collection"><li>{{name}}</li></ul></div>',
                    autoParseBinds: true,
                    fields: {
                        collection: collection
                    }
                });

                expect(vm.$('li:eq(0)').html()).toBe('Vasya');
                expect(vm.$('li:eq(1)').html()).toBe('Petya');
                collection.at(0).prop('name', 'Sasha');
                expect(vm.$('li:eq(0)').html()).toBe('Sasha');
            });

            it('supports table', function () {

                var vm = ViewModel.create({
                    el: '<table data-bind="eachModel: collection"><tr><td>{{value}}</td></tr></table>',
                    autoParseBinds: true,
                    fields: {
                        collection:  new Collection([
                            {value: "foo"}
                        ])
                    }
                });

                expect(vm.el.innerHTML.toLowerCase().replace(/\s+/g, '')).toBe('<tbody><tr><td>foo</td></tr></tbody>')
            });
        });
    });


    describe('inline modificators', function () {

        describe('{{}}', function () {
            it('inserts value of observable', function () {


                var vm = ViewModel.create({
                    el: '<div>Hello{{name}}! {{value}}<div>asd</div></div>',
                    autoParseBinds: true,
                    fields: {
                        name: '<span style="color: green;">Moe</span>',
                        value: ''
                    }
                });


                expect(vm.$el.text()).toEqual('HelloMoe! asd');
                vm.prop('value', 12);
                expect(vm.$el.text()).toEqual('HelloMoe! 12asd');


            });


            it('supports filters', function () {

                var vm = ViewModel.create({
                    el: '<div>{{value | sumFilter:"321"}}</div>',
                    autoParseBinds: true,
                    fields: {
                        value: 123
                    }
                });


                expect(vm.el.innerHTML).toBe('444');
            });

            it('supports custom regex', function () {

                var lastRegex = ViewModel.inlineModificators['{{}}'].regex;

                ViewModel.inlineModificators['{{}}'].regex = /\$\{([\s\S]+?)\}/g;

                var vm = ViewModel.create({
                    el: '<div>Hello ${name}! ${value}<div>asd</div></div>',
                    autoParseBinds: true,
                    fields: {
                        name: '<span style="color: green;">Moe</span>',
                        value: ''
                    }
                });

                expect(vm.$el.text()).toBe('Hello Moe! asd');

                ViewModel.inlineModificators['{{}}'].regex = lastRegex;

            });


            it('supports empty values', function () {

                var vm = ViewModel.create({
                    el: '<div>{{name}}</div>',
                    autoParseBinds: true,
                    fields: {
                        name: '<span style="color: green;">Moe</span>'
                    }
                });

                expect(vm.$el.text()).toBe('Moe');
                vm.prop('name', '');
                expect(vm.$el.text()).toBe('');
                vm.prop('name', 'Moe');
                expect(vm.$el.text()).toBe('Moe');
            });


            it('0 is not empty string', function () {

                var vm = ViewModel.create({
                    el: '<div>{{value}}</div>',
                    autoParseBinds: true,
                    fields: {
                        value: 0
                    }
                });


                expect(vm.el.innerHTML).toBe('0');

                vm.prop('value', null);
                expect(vm.el.innerHTML).toBe('');
            });

            it('supports line breaks', function () {

                var vm = ViewModel.create({
                    el: '<div>\n\
        {{name}} \n\
            </div>',
                    autoParseBinds: true,
                    fields: {
                        name: 'foo'
                    }
                });


                expect($.trim(vm.$el.text())).toBe('foo');
            });

        });


    });


    it('support custom tags', function () {
        //add custom tag
        ViewModel.tag('smartinput', function ($el, context) {
            //template
            var $markup = $('<div class="my_cool_style"><input type="text"/></div>');

            //link to input
            var $input = $markup.find('input');

            //replace markup
            $el.after($markup).remove();

            //$el.attr('value') == 'name'
            this.applyFilters($el.attr('value'), context, function (value) {
                $input.val(value);
            });
        });

        var vm = ViewModel.create({
            el: '<div><smartinput value="name"></smartinput></div>',
            fields: {
                name: 'Moe'
            },
            autoParseBinds: true
        });
        expect(vm.$('input').val()).toBe('Moe');
    });


    it('support custom attributes', function () {
        //en locale
        var lang = new Model({
            hello: 'Hello friend!',
            bye: 'Good bye friend!'
        });
        //creating new custom attribute
        ViewModel.customAttributes.lang = function ($el, value) {


            $el.html(lang.prop(value));
            lang.on('change:' + value, function (val) {
                $el.html(val);
            });
        };


        var vm = ViewModel.create({
            el: '<div lang="hello"></div>',
            autoParseBinds: true
        });


        expect(vm.el.innerHTML).toBe('Hello friend!');

        //change locale to fr
        lang.prop({
            hello: 'Bonjour ami!',
            bye: 'Au revoir ami!'
        });

        expect(vm.el.innerHTML).toBe('Bonjour ami!');

    });


});
