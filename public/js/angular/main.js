app = angular.module('app', ['checklist-model']);

app.factory('debounce', function ($timeout, $q) {
    return function debounce(func, wait, immediate) {
        var timeout;
        var deferred = $q.defer();
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) {
                    deferred.resolve(func.apply(context, args));
                    deferred = $q.defer();
                }
            };
            var callNow = immediate && !timeout;
            if (timeout) {
                $timeout.cancel(timeout);
            }
            timeout = $timeout(later, wait);
            if (callNow) {
                deferred.resolve(func.apply(context, args));
                deferred = $q.defer();
            }
            return deferred.promise;
        };
    };
});

/**
 * Angular Selectize2 (fixed)
 * Inspired by https://github.com/machineboy2045/angular-selectize
 **/
app.value('selectizeConfig', {}).directive("selectize", ['selectizeConfig', '$timeout', function(selectizeConfig, $timeout) {

  return {
    restrict: 'A',
    require: '^ngModel',
    link: function(scope, element, attrs, ngModel) {
      var config;
      var selectize;
      var prevNgClasses = '';

      //config
      config = scope.$eval(attrs.selectize);
      config.options = scope.$eval(attrs.options) || [];
      if(typeof selectizeConfig !== 'undefined'){
        config = angular.extend(config, selectizeConfig);
      }
      config.maxItems = config.maxItems || null; //default to tag editor

      //support simple arrays
      if(config.options && typeof config.options[0] === 'string'){
        config.options = $.map(config.options, function(opt, index){
          return {id:index, text:opt, value:opt};
        })
        config.sortField = config.sortField || 'id'; //preserve order
      }

      config.create = function(input) {
        var data = {};
        data[selectize.settings.labelField] = input;
        data[selectize.settings.valueField] = input;
        return data;
      };

      //init
      $(element).selectize(config);
      selectize = $(element)[0].selectize;

      function addAngularOption(value, data) {
        $timeout(function(){
          if(ngModel.$modelValue.length != selectize.currentResults.total)
          {
            ngModel.$modelValue.push(value);
          }
        });
      }

      function removeAngularOption(value, data) {
        $timeout(function(){
            ngModel.$setViewValue(selectize.items);
        });
      }

      function updateAngularOption(value, data)
      {
        $timeout(function() {
            if(ngModel.$viewValue.length != selectize.currentResults.total)
            {
                ngModel.$setViewValue(value);
            }
        });
      }

      function updateClasses(){
        var ngClasses = $(element).prop('class').match(/ng-[a-z-]+/g).join(' ');

        if(ngClasses != prevNgClasses){
          var selectizeClasses = selectize.$control.prop('class').replace(/ng-[a-z-]+/g, '');
          prevNgClasses = ngClasses;
          selectize.$control.prop('class', selectizeClasses+' '+ngClasses);
        }
      }

      function refreshItem(val){
        if(!selectize.userOptions[val]){
          selectize.addOption( selectize.settings.create(val) );
        }
      }

      function refreshSelectize(value){
        $timeout(function(){
          if(angular.isArray(value)){
            angular.forEach(value, refreshItem);
          }else{
            refreshItem(value);
          }
          selectize.setValue(value);
          updateClasses();
        });
      }

      function toggle(disabled){
        disabled ? selectize.disable() : selectize.enable();
      }

      // selectize.on('option_add', addAngularOption);
      selectize.on('item_remove', removeAngularOption);
      selectize.on('option_remove', removeAngularOption);
      selectize.on('change', updateAngularOption);
      scope.$watch(function(){ return ngModel.$modelValue }, refreshSelectize, true);
      attrs.$observe('disabled', toggle);
    }
  };
}]);

app.controller('AdminCtrl', function ($scope) {

});

app.controller('CreateCtrl', function ($scope, $sce, $http) {

    // Vars
    var marked = window.marked;
    var hljs = window.hljs;
    var humane = window.humane;

    $scope.user = window.Gruik.user;

    $scope.currentPost = {
        id: 0,
        title: '',
        md_content: '',
        tags: []
    };

    $scope.is_preview = false;
    $scope.loading = false;

    // Selectize configuration
    $scope.selectizeOptions = window.Gruik.tags;

    $scope.selectizeConfig = {
        plugins: ['remove_button'],
        maxItems: null,
        openOnFocus: false,
        maxOptions: 5,
        delimiter: ',',
        valueField: 'label',
        labelField: 'label',
        searchField: ['label'],
        persist: false
    };

    // Marked configuration
    marked.setOptions({
        gfm: true,
        breaks: true,
        sanitize: true,
        highlight: function (code) {
            return hljs.highlightAuto(code).value;
        }
    });

    // FUNCTIONS
    $scope.triggerSaved = function(success)
    {
        humane.remove(function() {
            if(success)
            {
                humane.log('<span class="text-success"><i class="fa fa-check"></i> Post saved !</span>', { timeout: 1500, clickToClose: true });
            }
            else
            {
                humane.log('<span class="text-danger"><i class="fa fa-times"></i> An error has occured !</span>', { timeout: 5000, clickToClose: true });
            }
        });
    };

    $scope.save = function()
    {
        $scope.loading = true;
        $scope.currentPost._token = $("#csrf").val();

        if($scope.currentPost.id === 0)
        {
            // Creating post
            $http.post('/api/posts', $scope.currentPost).
            success(function(data) {
                $scope.currentPost.id = data.id;
                $scope.loading = false;
                $scope.triggerSaved(true);
            }).
            error(function(data, status, headers, config) {
                console.log('fail = ', data);
                $scope.loading = false;
                $scope.triggerSaved(false);
            });
        }
        else
        {
            // Updating post
            $http.put('/api/posts/' + $scope.currentPost.id, $scope.currentPost).
            success(function(data, status, headers, config) {
                $scope.currentPost = _.extend(data, $scope.currentPost);
                $scope.loading = false;
                $scope.triggerSaved(true);
            }).
            error(function(data, status, headers, config) {
                console.log('fail = ', data);
                $scope.loading = false;
                $scope.triggerSaved(false);
            });
        }
    };

    $scope.preview = function(state)
    {
        if(state)
        {
            $scope.currentPost.html = $sce.trustAsHtml(marked( $scope.currentPost.md_content ));
        }

        $scope.is_preview = state;
    };

    // Init ACE EDITOR
    $scope.editor = ace.edit("editor");
    var MarkdownMode = require("ace/mode/markdown").Mode;

    $scope.editor.setTheme("ace/theme/github");
    $scope.editor.setFontSize(14);
    $scope.editor.setShowPrintMargin(false);
    $scope.editor.setHighlightActiveLine(false);
    $scope.editor.getSession().setMode(new MarkdownMode());

    $scope.editor.getSession().on('change', function(e) {
        $scope.currentPost.md_content = $scope.editor.getValue();
    });

    // If edition
    if(window.Gruik.edited_post)
    {
        $scope.currentPost = window.Gruik.edited_post;
        $scope.currentPost.tags = window.Gruik.edited_tags;

        $scope.editor.setValue($scope.currentPost.md_content);
        $scope.editor.gotoLine(1);
    }
    else
    {
        // Set user preferences to post
        $scope.currentPost.private = $scope.user.preferences['posts.private'];
        $scope.currentPost.allow_comments = $scope.user.preferences['posts.allow_comments'];
    }

});

app.controller('DashboardCtrl', function ($scope, $http, $window, debounce) {

    $scope.selected = {
        posts : []
    };

    $scope.posts = window.Gruik.posts.data;
    $scope._posts = window.Gruik.posts.data;

    $scope.search = {
        term: '',
        tags: []
    };

    $scope._token = $("#csrf").val();

    $scope.deleteSelected = function(id)
    {
        var text = id ? "Delete this post ?" : "Delete selected posts ?";
        var ids = [];

        var deletePost = function(ids)
        {
            $scope.loading = true;

            $http.post('/api/posts/multiple_delete', {'ids': ids, '_token': $scope._token}).
            success(function(data, status, headers, config) {
                $window.location.reload();
                $scope.loading = false;
            }).
            error(function(data, status, headers, config) {
                console.log('fail = ', data);
                $scope.loading = false;
            });
        };

        if(id)
        {
            ids.push(id);
        }
        else
        {
            ids = angular.copy($scope.selected.posts);
        }

        smoke.confirm(text, function(e){
            if(e) {
                deletePost(ids);
            }
        }, {
            ok: "Yes",
            cancel: "Gruik, NO !",
            reverseButtons: true
        });
    };

    $scope.doSearch = function()
    {
        if($scope.search.term == '' && $scope.search.tags.length === 0)
        {
            $scope.searchIsActive = false;

            // Restore post from page
            $scope.posts = angular.copy($scope._posts);
        }
        else
        {
            $scope.searchIsActive = true;

            $http.post('/api/posts/search', {'term': $scope.search.term, 'tags': $scope.search.tags, '_token': $scope._token}).
            success(function(data, status, headers, config) {
                $scope.posts = data;
                $scope.searchIsActive = false;
            }).
            error(function(data, status, headers, config) {
                console.log('data = ' , data);
                $scope.searchIsActive = false;
            });
        }
    };

    $scope.$watch('search', debounce(function () {
        $scope.doSearch();
    }, 500, false), true);

});

app.controller('ExploreCtrl', function ($scope) {

    $scope.posts = window.Gruik.posts.data;
    $scope.total_posts = window.Gruik.posts.total;

    $scope.search = {
        term: '',
        tags: []
    };

});

app.controller('UserProfileCtrl', function ($scope) {
    $scope.user = window.Gruik.user;
    $scope.last_login = window.Gruik.last_login;

    $scope.total_posts = window.Gruik.posts.total;
    $scope.total_tags = window.Gruik.total_tags;
    $scope.total_days = window.Gruik.total_days;

    $scope.posts = window.Gruik.posts.data;
});

app.controller('TagsCtrl', function ($scope) {

});

app.controller('SettingsCtrl', function ($scope, $http, $window) {

    var humane = window.humane;

    $scope.user = window.Gruik.user;
    $scope._token = $("#csrf").val();

    $scope.saveUser = function()
    {
        $scope.loading = true;
        $scope.user._token = $scope._token;

        $http.put('/api/users/'+$scope.user.id, $scope.user).
        success(function(data, status, headers, config) {
            humane.log('<span class="text-success"><i class="fa fa-check"></i> Settings saved !</span>', { timeout: 1500, clickToClose: true }, function() {
                $window.location.reload();
            });
            $scope.loading = false;
        }).
        error(function(data, status, headers, config) {
            humane.log('<span class="text-danger"><i class="fa fa-times"></i> Error : '+data.flash+'</span>', { timeout: 5000, clickToClose: true });
            console.log('fail = ', data);
            $scope.loading = false;
        });
    };

});

app.controller('ViewCtrl', function ($scope, $sce) {

    var marked = window.marked;
    var hljs = window.hljs;

    $scope.post = window.Gruik.post;
    $scope.comments_loaded = false;
    $scope.loading = false;

    marked.setOptions({
        gfm: true,
        breaks: true,
        sanitize: true,
        highlight: function (code) {
            return hljs.highlightAuto(code).value;
        }
    });

    $scope.post.html = null;
    $scope.post.html = $sce.trustAsHtml( marked( $scope.post.md_content ) );

    $scope.loadComments = function()
    {
        $scope.loading = true;
        var disqus_shortname = window.Gruik.disqus_username;

        $.ajax({
              type: "GET",
              url: "//" + disqus_shortname + ".disqus.com/embed.js",
              dataType: "script",
              cache: true
        }).then(function() {
            $scope.comments_loaded = true;
            $scope.loading = false;
            $scope.$apply();
        }, function() {
            $scope.loading = false;
            $scope.$apply();
            smoke.signal('<i class="fa fa-times"></i> Error while loading Disqus comments', function(e){

            }, {
                duration: 3000
            });

        });
    };
});

app.controller('RegisterCtrl', function ($scope, $http, $window) {

    $scope.user = {
        email: '',
        password: '',
        username: ''
    };

    $scope.loading = false;

    $scope.register = function()
    {
        $scope.loading = true;
        $scope.flash = null;

        $http.post('/register', $scope.user).
        success(function(data, status, headers, config) {
            $scope.loading = false;
            $window.location.href='/';
        }).
        error(function(data, status, headers, config) {
            $scope.loading = false;
            $scope.flash = data.flash;
        });
    };

});

app.controller('LoginCtrl', function ($scope, $http, $window) {

    $scope.user = {
        email: '',
        password: '',
        remember: false
    };

    $scope.loading = false;

    $scope.login = function()
    {
        $scope.loading = true;
        $scope.flash = null;

        $http.post('/login', $scope.user).
        success(function(data, status, headers, config) {
            $scope.loading = false;
            $window.location.href='/';
        }).
        error(function(data, status, headers, config) {
            $scope.loading = false;
            $scope.flash = data.flash;
        });
    };
});

app.controller('ForgotCtrl', function ($scope, $http) {

    $scope.email = '';

    $scope.loading = false;

    $scope.sendEmail = function ()
    {
        $scope.loading = true;
        $scope.flash = null;

        $http.post('/forgot-password', {email: $scope.email})
            .success(function (data) {

                $scope.loading = false;

                smoke.signal('Email sent', function(e){

                }, {
                    duration: 3000
                });
            })
            .error(function (data) {
                $scope.loading = false;
                $scope.flash = data.flash;
            });
    };
});

app.controller('ResetPasswordCtrl', function ($scope, $http, $timeout, $window) {

    $scope.password             = '';
    $scope.passwordConfirmation = '';

    $scope.loading = false;

    $scope.sendNewPassword = function (token)
    {
        $scope.loading = true;
        $scope.flash = null;

        $http.post('/reset-password', {token: token, password: $scope.password, password_confirmation: $scope.password_confirmation})
            .success(function (data) {

                $scope.loading = false;

                $timeout(function() {
                    $window.location.href='/';
                }, 1500);

                smoke.signal('Password reset !', function(e){

                }, {
                    duration: 1500
                });
            })
            .error(function (data) {
                $scope.loading = false;
                $scope.flash = data.flash;
            });
    };
});

app.controller('SearchCtrl', function ($scope, $timeout) {

    $scope.result = window.Gruik.result;
    $scope.sortBy = window.Gruik.sortBy ? window.Gruik.sortBy : 'created_at,desc';

    // Refresh page on sortBy change
    $scope.$watch('sortBy', function(oldValue, newValue) {
        if (oldValue !== newValue) {
            $timeout(function() {
                document.querySelector('#applySearch').click();
            });
        }
    });
});