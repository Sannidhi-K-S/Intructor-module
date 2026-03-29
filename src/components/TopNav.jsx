import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    History,
    Bell,
    GraduationCap,
    FileText,
    User,
    LogOut,

    X
} from 'lucide-react';
import useAppStore from '../store/useAppStore';

const TopNav = () => {
    const { user } = useAppStore();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'History', path: '/history', icon: History },
        { name: 'Training', path: '/training', icon: GraduationCap },
        { name: 'Reports', path: '/logbook', icon: FileText },
    ];




    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shadow-sm">
                                <span className="font-bold text-lg">F</span>
                            </div>
                            <span className="text-lg font-bold tracking-tight text-gray-900 hidden sm:block">
                                Flight<span className="text-gray-400">School</span>
                            </span>
                        </div>

                        {/* Desktop Navigation - Hidden on tablet/mobile, visible on large screens */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `nav-link ${isActive ? 'nav-link-active' : ''}`
                                    }
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </NavLink>
                            ))}
                        </nav>

                        {/* User Profile / Notifications / Search */}
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <Bell className="w-5 h-5" />
                            </button>
                            <div className="h-4 w-[1px] bg-gray-200 mx-1 hidden sm:block"></div>

                            <div className="relative">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-600 border border-gray-100 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm">
                                        {user?.name?.split(' ')?.map(n => n[0])?.join('') || "AM"}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-[12px] font-bold text-gray-900 leading-none">{user?.name || "Capt. Morgan"}</p>
                                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">{user?.designation || "Instructor"}</p>
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[60]" onClick={() => setIsMenuOpen(false)}></div>
                                        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2 pb-1">Account</p>
                                                <div className="flex items-center gap-3 px-2 py-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                        {user?.name?.split(' ')?.map(n => n[0])?.join('') || "AM"}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[13px] font-bold text-gray-900 truncate">{user?.name || "Capt. Morgan"}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{user?.email || "morgan@flightschool.com"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-1">
                                                <button
                                                    onClick={() => { setIsMenuOpen(false); setIsProfileOpen(true); }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                                                >
                                                    <User className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                                    My Profile
                                                </button>
                                                <button
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile/Tablet Bottom Nav - Visible on screens smaller than lg */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-2xl border-t border-gray-200 px-6 py-3 pb-8 md:pb-4 flex justify-between items-center z-[100] shadow-[0_-5px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-5 duration-300">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-blue-700' : 'text-gray-400'}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-50' : 'group-hover:bg-gray-50'}`}>
                                    <item.icon className={`w-6 h-6 md:w-7 md:h-7 ${isActive ? 'text-blue-700' : ''}`} />
                                </div>
                                <span className={`text-[10px] md:text-[11px] font-bold uppercase tracking-tight ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>
                                    {item.name}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>

            {isProfileOpen && (
                <div
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => setIsProfileOpen(false)}
                >

                    {/* Modal Box */}
                    <div
                        className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl p-8"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Close Button */}
                        <button
                            onClick={() => setIsProfileOpen(false)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black"
                        >
                            <X size={20} />
                        </button>

                        {/* TOP SECTION */}
                        <div className="flex items-center gap-5 mb-6">

                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold">
                                {user?.name?.split(' ')?.map(n => n[0])?.join('') || "AM"}
                            </div>

                            {/* Name + Role */}
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {user?.name || "Capt. Morgan"}
                                </h2>

                                <p className="text-sm text-slate-500 mt-1">
                                    {user?.designation || "Senior Flight Instructor"}
                                </p>
                            </div>

                        </div>

                        {/* Divider */}
                        <div className="border-t border-slate-200 mb-6"></div>

                        {/* DETAILS */}
                        <div className="space-y-4 text-sm">

                            <div className="flex justify-between">
                                <span className="text-slate-500">Designation</span>
                                <span className="font-medium text-slate-900">
                                    {user?.designation}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">Email</span>
                                <span className="font-medium text-slate-900">
                                    {user?.email}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-slate-500">Phone</span>
                                <span className="font-medium text-slate-900">
                                    {user?.phone}
                                </span>
                            </div>

                        </div>

                    </div>
                </div>
            )}
        </>
    );
};

export default TopNav;