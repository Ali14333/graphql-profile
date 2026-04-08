// Import getToken so we can attach the JWT to every request
import { getToken } from "./auth.js";

// Single GraphQL endpoint — unlike REST (which has many URLs),
// GraphQL uses one URL and the query string describes what data we want
const GRAPHQL_URL = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

// Reusable function that all our queries go through
// Takes a GraphQL query string and optional variables
async function fetchGraphQL(query, variables = {}) {
    const token = getToken();

    // POST the query as JSON, with Bearer auth (sends our JWT)
    // Bearer auth = "here's my token, give me access to my data"
    // This is AUTHORIZATION (what can I access), vs Basic auth which was AUTHENTICATION (who am I)
    const response = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
    });

    // Check for HTTP-level errors (network issues, server down, etc.)
    if (!response.ok) {
        throw new Error("GraphQL request failed");
    }

    const data = await response.json();

    // GraphQL can return HTTP 200 but still have errors in the response body
    // So we need to check both levels
    if (data.errors) {
        throw new Error(data.errors[0].message);
    }

    // data.data contains the actual query results
    return data.data;
}

export { fetchGraphQL };
