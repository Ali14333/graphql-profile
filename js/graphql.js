import { getToken } from "./auth.js";

const GRAPHQL_URL = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

async function fetchGraphQL(query, variables = {}) {
    const token = getToken();

    const response = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
        throw new Error("GraphQL request failed");
    }

    const data = await response.json();

    if (data.errors) {
        throw new Error(data.errors[0].message);
    }

    return data.data;
}

export { fetchGraphQL };