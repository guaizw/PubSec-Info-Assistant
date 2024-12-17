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
import axios from 'axios';
import { execSync } from 'child_process';

// Function to get the access token using Azure CLI
function getAccessToken() {
    try {
        const result = execSync('az account get-access-token --resource https://graph.microsoft.com/ --query accessToken -o tsv');
        return result.toString().trim();
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
}

// The appRoleId you are checking for
const targetAppRoleId = 'a035ee52-37a8-4093-b175-63e6481f2e7b';

async function getUserId(accessToken) {
    try {
        const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data.id;
    } catch (error) {
        console.error('Error fetching user ID:', error);
        return null;
    }
}

async function checkAppRole() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        return false;
    }

    const userId = await getUserId(accessToken);
    if (!userId) {
        return false;
    }

    try {
        const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/appRoleAssignments`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const appRoleAssignments = response.data.value;
        return appRoleAssignments.some(role => role.appRoleId === targetAppRoleId);
    } catch (error) {
        console.error('Error fetching app role assignments:', error);
        return false;
    }
}


// const contentmanagerstatus = checkAppRole();

export const Layout = () => {
    const [featureFlags, setFeatureFlags] = useState<GetFeatureFlagsResponse | null>(null);
    const [contentManagerStatus, setContentManagerStatus] = useState<boolean | null>(null);

    async function fetchFeatureFlags() {
        try {
            const fetchedFeatureFlags = await getFeatureFlags();
            setFeatureFlags(fetchedFeatureFlags);
        } catch (error) {
            // Handle the error here
            console.log(error);
        }
    }
    useEffect(() => {
        fetchFeatureFlags();
        checkAppRole().then(status => setContentManagerStatus(status));
    }, []);

    if (contentManagerStatus === null) {
        return <div>Loading...</div>;
    }
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
                            {contentManagerStatus && (
                            <li className={styles.headerNavLeftMargin}>
                                <NavLink to="/content" className={({ isActive }) => (isActive ? styles.headerNavPageLinkActive : styles.headerNavPageLink)}>
                                    Manage Content
                                </NavLink>
                            </li>)}
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
