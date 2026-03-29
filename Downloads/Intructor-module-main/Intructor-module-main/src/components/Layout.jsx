import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

const Layout = () => {
    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <TopNav />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-12">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
