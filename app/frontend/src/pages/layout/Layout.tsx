
// /workspaces/PubSec-Info-Assistant/app/frontend/src/pages/layout/Layout.tsx
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { Outlet, NavLink, Link } from "react-router-dom";
import openai from "../../assets/openai.svg";
import { WarningBanner } from "../../components/WarningBanner/WarningBanner";
import styles from "./Layout.module.css";
import { Title } from "../../components/Title/Title";
import { getFeatureFlags, GetFeatureFlagsResponse } from "../../api";
import { useEffect, useState } from "react";
import { PublicClientApplication, Configuration, AuthenticationResult } from '@azure/msal-browser';
const msalConfig: Configuration = {
    auth: { 
        authority: "https://login.microsoftonline.com/a2c8f93f-126b-4596-a360-8941a8984b08",
        clientId: "37eea007-203c-4f92-bb40-8c1cd0091761",
        postLogoutRedirectUri: "https://infoasst-web-jgywy.azurewebsites.net/.auth/login/aad/callback",
        redirectUri: "https://infoasst-web-jgywy.azurewebsites.net/.auth/login/aad/callback",
        navigateToLoginRequestUrl: true
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: true
    }
};

const loginRequest = {
    scopes: ['api://37eea007-203c-4f92-bb40-8c1cd0091761/.default']
};

const msalInstance = new PublicClientApplication(msalConfig);

async function initializeMsal() {
    await msalInstance.initialize();
}

async function loginAndGetToken() {
    try {
        await initializeMsal();
        const loginResponse: AuthenticationResult = await msalInstance.loginPopup(loginRequest);

        const account = loginResponse.account;
        if (account) {
            const tokenResponse: AuthenticationResult = await msalInstance.acquireTokenSilent({
                scopes: ['User.Read'],
                account: account,
            });

            console.log('Bearer Token:', tokenResponse.accessToken);
            return tokenResponse.accessToken;
        }
    } catch (error) {
        console.error('Error acquiring token:', error);
    }
    return null;
}

export const Layout = () => {
    const [featureFlags, setFeatureFlags] = useState<GetFeatureFlagsResponse | null>(null);
    const [contentManagerStatus, setContentManagerStatus] = useState<string | null>(null);

    async function fetchFeatureFlags() {
        try {
            const fetchedFeatureFlags = await getFeatureFlags();
            setFeatureFlags(fetchedFeatureFlags);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchFeatureFlags();
        async function fetchContentManagerStatus() {
            const status = await loginAndGetToken();
            setContentManagerStatus(status);
        }
        fetchContentManagerStatus();
    }, []);

    // if (contentManagerStatus === null) {
    //     return <div>Waiting for Authentication...</div>;
    // }

    return (
        <div className={styles.layout}>
            <header className={styles.header} role={"banner"}>
                <WarningBanner />
                <div className={styles.headerContainer}>
                    <div className={styles.headerTitleContainer}>
                        <img src={openai} alt="Azure OpenAI" className={styles.headerLogo} />
                        <h3 className={styles.headerTitle}><Title /></h3>
                    </div>
                    <nav>
                        <ul className={styles.headerNavList}>
                            <li>
                                <NavLink to="/" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                                    Chat
                                </NavLink>
                            </li>
                            <li className={styles.headerNavLeftMargin}>
                                <NavLink to="/content" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                                    Manage Content {contentManagerStatus}
                                </NavLink>
                            </li>
                            {featureFlags?.ENABLE_MATH_ASSISTANT &&
                                <li className={styles.headerNavLeftMargin}>
                                    <NavLink to="/tutor" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                                        Math Assistant
                                        <br />
                                        <p className={styles.centered}>(preview)</p>
                                    </NavLink>
                                </li>
                            }
                            {featureFlags?.ENABLE_TABULAR_DATA_ASSISTANT &&
                                <li className={styles.headerNavLeftMargin}>
                                    <NavLink to="/tda" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                                        Tabular Data Assistant
                                        <br />
                                        <p className={styles.centered}>(preview)</p>
                                    </NavLink>
                                </li>
                            }
                        </ul>
                    </nav>
                </div>
            </header>
            <Outlet />
            <footer>
                <WarningBanner />
            </footer>
        </div>
    );
};

