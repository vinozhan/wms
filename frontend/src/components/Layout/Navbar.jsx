import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon, 
  BellIcon, 
  UserCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { RecycleIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', roles: ['resident', 'business', 'collector', 'admin'] },
    { name: 'Waste Bins', href: '/waste-bins', roles: ['resident', 'business', 'collector', 'admin'] },
    {
      name: 'Collections',
      href: '/collections',
      roles: ['collector', 'admin'],
      subItems: [
        { name: 'Collection Management', href: '/collections', roles: ['collector', 'admin'] },
        { name: 'Route Optimization', href: '/route-optimization', roles: ['collector', 'admin'] },
        { name: 'Collector Feedback', href: '/collector-feedback', roles: ['collector', 'admin'] }
      ]
    },
    {
      name: 'Payments',
      href: '/payments',
      roles: ['resident', 'business', 'admin'],
      subItems: [
        { name: 'Payments', href: '/payments', roles: ['resident', 'business', 'admin'] },
        { name: 'PAYT Billing', href: '/payt-billing', roles: ['resident', 'business', 'admin'] },
        { name: 'Recycling Credits', href: '/recycling-credits', roles: ['resident', 'business', 'admin'] }
      ]
    },
    {
      name: 'Analytics',
      href: '/analytics',
      roles: ['admin'],
      subItems: [
        { name: 'System Analytics', href: '/analytics', roles: ['admin'] },
        { name: 'Environmental Impact', href: '/environmental', roles: ['admin'] }
      ]
    },
    { name: 'Users', href: '/users', roles: ['admin'] },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const filteredNavigation = navigation.filter(item => 
    !user || item.roles.includes(user.userType)
  );

  if (!isAuthenticated) {
    return (
      <nav className="bg-green-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <RecycleIcon className="h-8 w-8 text-white mr-2" />
                <span className="text-xl font-bold text-white">Eco Waste LK</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-white hover:text-green-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-white text-green-600 hover:bg-green-50 px-4 py-2 rounded-md text-sm font-medium"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-green-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <RecycleIcon className="h-8 w-8 text-white mr-2" />
                <span className="text-xl font-bold text-white">Eco Waste LK</span>
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-8">
              {filteredNavigation.map((item) => (
                <div key={item.name} className="relative">
                  {item.subItems ? (
                    <div 
                      className="relative group"
                      onMouseLeave={() => {
                        setTimeout(() => setOpenDropdown(null), 100);
                      }}
                    >
                      <button
                        className={`${
                          item.subItems.some(sub => location.pathname === sub.href) || location.pathname === item.href
                            ? 'border-green-200 text-white'
                            : 'border-transparent text-green-100 hover:border-green-300 hover:text-white'
                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                        onMouseEnter={() => setOpenDropdown(item.name)}
                      >
                        {item.name}
                        <ChevronDownIcon className="ml-1 h-4 w-4" />
                      </button>
                      {openDropdown === item.name && (
                        <div 
                          className="absolute top-full left-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                        >
                          <div className="py-1">
                            {item.subItems.filter(subItem => 
                              !user || subItem.roles.includes(user.userType)
                            ).map((subItem) => (
                              <Link
                                key={subItem.name}
                                to={subItem.href}
                                className={`${
                                  location.pathname === subItem.href
                                    ? 'bg-green-50 text-green-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                } block px-4 py-2 text-sm`}
                                onClick={() => setOpenDropdown(null)}
                              >
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className={`${
                        location.pathname === item.href
                          ? 'border-green-200 text-white'
                          : 'border-transparent text-green-100 hover:border-green-300 hover:text-white'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="hidden md:ml-4 md:flex md:items-center md:space-x-4">
            <button className="p-1 rounded-full text-green-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-600 focus:ring-white">
              <BellIcon className="h-6 w-6" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center max-w-xs bg-green-600 rounded-full text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-600 focus:ring-white"
              >
                <UserCircleIcon className="h-8 w-8" />
                <span className="ml-2 text-sm font-medium">{user?.name}</span>
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </button>
              
              {isUserMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-green-100 hover:text-white hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 sm:px-3">
            {filteredNavigation.map((item) => (
              <div key={item.name}>
                <Link
                  to={item.href}
                  className={`${
                    location.pathname === item.href
                      ? 'bg-green-700 text-white'
                      : 'text-green-100 hover:bg-green-500 hover:text-white'
                  } block px-3 py-2 rounded-md text-base font-medium`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
                {item.subItems && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.filter(subItem => 
                      !user || subItem.roles.includes(user.userType)
                    ).map((subItem) => (
                      <Link
                        key={subItem.name}
                        to={subItem.href}
                        className={`${
                          location.pathname === subItem.href
                            ? 'bg-green-600 text-white'
                            : 'text-green-200 hover:bg-green-500 hover:text-white'
                        } block px-3 py-2 rounded-md text-sm font-medium`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-green-500">
            <div className="flex items-center px-5">
              <UserCircleIcon className="h-10 w-10 text-white" />
              <div className="ml-3">
                <div className="text-base font-medium text-white">{user?.name}</div>
                <div className="text-sm font-medium text-green-100">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                to="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-green-100 hover:text-white hover:bg-green-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Your Profile
              </Link>
              <Link
                to="/settings"
                className="block px-3 py-2 rounded-md text-base font-medium text-green-100 hover:text-white hover:bg-green-500"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-green-100 hover:text-white hover:bg-green-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;