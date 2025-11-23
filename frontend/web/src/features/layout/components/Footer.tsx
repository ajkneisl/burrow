import React from 'react';
import {Github } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-background text-text border-t-4 border-primary mt-60">
            <div className="max-w-7xl mx-auto px-5 py-5 mt-2">

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-4">

                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">

                            <span className="text-2xl font-bold text-secondary tracking-tight">
                Burrow
              </span>
                        </div>
                        <p className="text-sm leading-relaxed mb-4">
                            Connecting University of Minnesota students through study groups, group projects, and more.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-text font-semibold mb-4 uppercase tracking-wider text-sm">
                            Discover
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="https://instagram.com/yord.eshete" className="hover:text-secondary transition-colors">
                                    Follow our Instagram
                                </a>
                            </li>
                            <li>
                                <a href="/browse" className="hover:text-secondary transition-colors">
                                    Upcoming Events
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-text font-semibold mb-4 uppercase tracking-wider text-sm">
                            Community
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="/about" className="hover:text-secondary transition-colors">
                                    About Us and FAQ
                                </a>
                            </li>
                            <li>
                                <a href="/team" className="hover:text-secondary transition-colors flex items-center gap-2">
                                    Meet the Team
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/ajkneisl/burrow"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-secondary transition-colors flex items-center gap-2"
                                >
                                    <Github size={14} />
                                    GitHub Repo
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-text font-semibold mb-4 uppercase tracking-wider text-sm">
                            Legal
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="/privacy" className="hover:text-secondary transition-colors">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="/tos" className="hover:text-secondary transition-colors">
                                    Terms of Service
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-card-border"></div>


                <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4 pt-4">
                    <div className="text-center md:text-left">
                        <p>&copy; {new Date().getFullYear()} Burrow (v0.4.0-BETA-2)</p>
                        <p className="mt-1">
                            Not affiliated with the University of Minnesota.
                        </p>
                    </div>


                </div>
            </div>
        </footer>
    );
};

export default Footer;