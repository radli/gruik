<a href="index.html" class="logo">
    <!-- Add the class icon to your logo image or logo icon to add the margining -->
    Gruiiiiik.
</a>
<!-- Header Navbar: style can be found in header.less -->
<nav class="navbar navbar-static-top" role="navigation">
    <!-- Sidebar toggle button-->
    <a href="#" class="navbar-btn sidebar-toggle" data-toggle="offcanvas" role="button">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
    </a>
    <a href="#" class="navbar-btn btn btn-sm btn-primary" role="button">Save</a>
    <input type="checkbox"> Private
    <div class="navbar-left" style="margin-left:8px; margin-top: 2px; margin-right: 10px;">
        <ul class="nav navbar-nav">
            <li>
                <input class="form-control input-sm navbar-btn" style="width:300px;" type="text" placeholder="Title...">
            </li>
        </ul>
    </div>
    <div class="navbar-right">
        <ul class="nav navbar-nav">
            <li class="dropdown user user-menu">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown">
                    <i class="glyphicon glyphicon-user"></i>
                    <span>{% $user->email %} <i class="caret"></i></span>
                </a>
                <ul class="dropdown-menu">
                    <!-- User image -->
                    <li class="user-header bg-light-blue">
                        <img src="../img/user.jpg" class="img-circle" alt="User Image" />
                        <p>
                            {% $user->email %}
                            <small>Member since Nov. 2012</small>
                        </p>
                    </li>
                    <!-- Menu Body -->
                    <li class="user-body">
                        <div class="col-xs-4 text-center">
                            <a href="#">Followers</a>
                        </div>
                        <div class="col-xs-4 text-center">
                            <a href="#">Sales</a>
                        </div>
                        <div class="col-xs-4 text-center">
                            <a href="#">Friends</a>
                        </div>
                    </li>
                    <!-- Menu Footer-->
                    <li class="user-footer">
                        <div class="pull-left">
                            <a href="#" class="btn btn-default btn-flat">Profile</a>
                        </div>
                        <div class="pull-right">
                            <a href="#" class="btn btn-default btn-flat">Sign out</a>
                        </div>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</nav>