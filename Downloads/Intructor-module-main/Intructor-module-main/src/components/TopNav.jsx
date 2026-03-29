import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    History,
    Bell,
    GraduationCap,
    FileText
} from 'lucide-react';

const TopNav = () => {
    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'History', path: '/history', icon: History },
        { name: 'Training', path: '/training', icon: GraduationCap },
        { name: 'Reports', path: '/logbook', icon: FileText },
    ];




    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white">
                            <span className="font-bold text-lg">F</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">
                            Flight<span className="text-slate-500">School</span>
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
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
                        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                            <Bell className="w-5 h-5" />
                        </button>
                        <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>
                        <button className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition-all">
                            <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-200 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                AM
                            </div>
                            <div className="text-left hidden lg:block">
                                <p className="text-[12px] font-bold text-slate-900 leading-none">Capt. Morgan</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Instructor</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Nav (Tablet optimization) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-2.5 flex justify-between items-center z-50">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 ${isActive ? 'text-slate-900' : 'text-slate-400'}`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{item.name}</span>
                    </NavLink>
                ))}
            </div>
        </header>
    );
};

export default TopNav;
