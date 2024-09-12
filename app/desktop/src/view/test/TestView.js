Ext.define('MyExtGenApp.view.test.TestViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.testviewcontroller',

    buildTiles: function () {
        let viewModel = this.getViewModel();
        viewModel.getStore('tasks').load({
            callback: () => viewModel.getStore('statuses').each(statusItem => 
                Ext.ComponentQuery.query(Ext.util.Format.format('panel[title={0}]', statusItem.data.name)).forEach(element => 
                    viewModel.getStore('tasks').query('status', statusItem.data.name).each(item =>
                        element.add({
                            style: { 'margin-top': '10px', },
                            with: 'auto',
                            height: 100,
                            border: true,
                            layout: {
                                type: 'hbox',
                                align: 'center',
                                pack: 'center'
                            },
                            xtype: 'panel',
                            html: Ext.util.Format.format('{0} <br> {1}', item.data.number, item.data.title),
                            bodyCls: item.data.priority.toLowerCase(),
                            data: item.data,
                            listeners: {
                                initialize: 'onSourceInit',
                                click: 'OnTileClick'
                            }
                        })
                    )
                )
            )
        });
    },
    onPageInit: function () {
        let view = this.getView();
        this.getViewModel().getStore('statuses').each(item => 
            view.add({
                xtype: 'panel',
                border: true,
                title: item.data.name,
                data: item.data.name,
                items: [],
                listeners: {
                    initialize: 'onTargetInit',
                }
            })
        );
        this.buildTiles();
    },
    onTargetInit: function (cmp) {
        let me = this;
        new Ext.drag.Target({
            element: Ext.get(cmp.id),
            listeners: {
                drop: (target, info) => {
                    let data = info.data;
                    data.status = cmp.getData();
                    me.onElementEditEnd(data);
                }
            }
        });
    },
    onSourceInit: function (cmp) {
        Ext.get(cmp.id).on('click', this.onTileClick.bind(this, cmp));
        new Ext.drag.Source({
            element: Ext.get(cmp.id),
            constrain: {
                horizontal: true,
            },
            describe: function (info) {
                info.cmpId = cmp.id;
                info.data = cmp.getData();
            },
            proxy: {
                type: 'none',
            },
        });
    },
    onTileClick: function (cmp) {
        let me = this;
        cmp.setBodyCls('highlight');

        let data = cmp.getData();

        var panel = Ext.create('Ext.form.Panel', {
            floated: true,
            modal: true,
            centered: true,
            closable: true,
            width: 500,
            height: 300,
            padding: 6,
            closeAction: 'destroy',
            buttons: {
                submit: {
                    handler: function () {
                        me.onElementEditEnd(this.up('formpanel').getValues());
                        this.up('formpanel').close();
                    }
                }
            },
            listeners: {
                close: this.onCloseEditWindow.bind(this),
            },
            items: [{
                xtype: 'hiddenfield',
                name: 'id',
                value: data.id,
            }, {
                xtype: 'textfield',
                name: 'number',
                label: 'Nmber',
                value: data.number,
            }, {
                xtype: 'textfield',
                name: 'title',
                label: 'Title',
                value: data.title,
            }, {
                xtype: 'textfield',
                name: 'name',
                label: 'Name',
                value: data.name,
            }, {
                xtype: 'combobox',
                name: 'status',
                label: 'Status',
                value: data.status,
                store: this.getViewModel().getStore('statuses'),
                valueField: 'name',
                displayField: 'name',
                queryMode: 'local'
            }, {
                xtype: 'combobox',
                name: 'priority',
                label: 'Priority',
                value: data.priority,
                store: this.getViewModel().getStore('priority'),
                valueField: 'name',
                displayField: 'name',
                queryMode: 'local',
            }, {
                xtype: 'datefield',
                name: 'date',
                label: 'Date',
                value: data.date,
                dateFormat: 'd-m-Y'
            }]
        });
        panel.show();
    },
    onElementEditEnd: function (data) {
        Ext.ComponentQuery.query('panel[bodyCls=highlight], panel[bodyCls=must], panel[bodyCls=should], panel[bodyCls=could]').forEach(element => {
            element.destroy();
        });
        let model = this.getViewModel().getStore('tasks').getById(data.id);
        ['number', 'title', 'name', 'status', 'priority', 'date'].forEach(name => model.set(name, data[name]));
        model.store.sync();
        this.buildTiles();
    },
    onCloseEditWindow: function () {
        Ext.ComponentQuery.query('panel[bodyCls=highlight]').forEach(element => {
            element.setBodyCls(element.getData().priority.toLowerCase())
        });
    }
});

Ext.define('MyExtGenApp.view.test.TestViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.testviewmodel',
    data: {
        name: 'MyExtGenApp',
    },
    stores: {
        statuses: {
            fields: ['name'],
            data: [
                { name: "PLAN", },
                { name: "IN PROGRESS", },
                { name: "TESTING", },
                { name: "DONE", },
            ]
        },
        priority: {
            fields: ['name'],
            data: [
                { name: "MUST", },
                { name: "SHOULD", },
                { name: "COULD", },
            ]
        },
        tasks: {
            idProperty: 'id',
            fields: ['id', 'number', 'title', 'name', 'status', 'priority', 'date'],
            sorters: [{
                    sorterFn: function(a, b) {
                        let tmp = a.get('name').localeCompare(b.get('name'));
                        if (tmp != 0) {
                            return -tmp;
                        }
                        let m = ["COULD", "SHOULD", "MUST",];
                        return m.indexOf(a.get("priority")) - m.indexOf(b.get("priority"));
                    },
                    direction: 'DESC'
            }],
            sortOnLoad: true,
            proxy: {
                type: 'localstorage',
                id: 'tasks',
            }
        }
    }
});

Ext.define('MyExtGenApp.view.test.TestView', {
    xtype: 'testview',
    extend: 'Ext.panel.Panel',
    scrollable: 'horizontal',
    viewModel: {
        type: 'testviewmodel'
    },
    controller: {
        type: 'testviewcontroller'
    },
    width: 'auto',
    height: 'auto',
    layout: {
        type: 'hbox',
        align: 'stretch'
    },
    bodyPadding: 5,
    defaults: {
        bodyPadding: 15,
        iconCls: 'x-fa fa-html5',
        height: 'auto',
        flex: 1,
        style: {
            zIndex: 0
        }
    },
    listeners: {
        initialize: 'onPageInit'
    }
});