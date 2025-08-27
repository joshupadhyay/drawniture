import { serve } from "bun";
import index from "./index.html";

// Claude API integration function
async function callClaudeAPI(furnitureType: string, drawings: any) {
  const prompt = `I am looking for furniture that matches these hand-drawn sketches. 

Furniture Type: ${furnitureType}

The user has drawn three views of this furniture piece (front, back, side). Based on these drawings, please:
1. Analyze the style, proportions, and key features
2. Generate search terms that would help find similar furniture
3. Suggest 3-5 specific furniture pieces that match this design

Please respond with a JSON object containing an array of "matches" with each item having:
- title: Product name
- description: Brief description highlighting why it matches
- searchTerms: Array of search terms to find similar items
- style: The furniture style (modern, traditional, minimalist, etc.)
- estimatedPrice: Price range estimate

Focus on the overall design, proportions, and distinctive features from the drawings.`;

  // For demo purposes, we'll use a mock response
  // In production, you'd call the actual Claude API here:

  // For now, we'll use mock data since we don't have the API key set up
  // Uncomment this when ready to use real Claude API:
  /*
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CLAUDE_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: drawings.front,
              },
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: drawings.back,
              },
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: drawings.side,
              },
            },
          ],
        },
      ],
    }),
  });
  */

  console.log("Analyzing furniture drawing:", furnitureType);
  console.log("Drawing data received:", Object.keys(drawings));

  // Mock Claude-like analysis for demo
  return {
    matches: [
      {
        title: `Contemporary ${furnitureType} with Clean Lines`,
        description: `Based on your drawings, this ${furnitureType} features the modern aesthetic and proportions you sketched.`,
        searchTerms: ["modern", "contemporary", "clean lines", furnitureType],
        style: "Modern",
        estimatedPrice: "$600-$1200",
      },
      {
        title: `Minimalist ${furnitureType} Design`,
        description: `Your sketch shows simple, functional lines perfect for modern living spaces.`,
        searchTerms: ["minimalist", "simple", "functional", furnitureType],
        style: "Minimalist",
        estimatedPrice: "$400-$800",
      },
      {
        title: `Scandinavian-Style ${furnitureType}`,
        description: `The proportions in your drawing suggest a cozy, Scandinavian-inspired piece.`,
        searchTerms: ["scandinavian", "cozy", "wood", furnitureType],
        style: "Scandinavian",
        estimatedPrice: "$500-$900",
      },
    ],
  };
}

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params?.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    "/api/search-furniture": {
      async POST(req) {
        try {
          const { furnitureType, drawings } = await req.json();

          // Call Claude API to analyze the drawings
          const claudeResponse = await callClaudeAPI(furnitureType, drawings);

          // Enhance results with placeholder images and shopping links
          const enhancedResults = claudeResponse.matches.map(
            (match: any, index: number) => ({
              ...match,
              image: `https://via.placeholder.com/300x200/${
                ["4f46e5", "059669", "dc2626", "f59e0b", "8b5cf6"][index % 5]
              }/ffffff?text=${encodeURIComponent(match.title)}`,
              price: match.estimatedPrice,
              source: [
                "West Elm",
                "Restoration Hardware",
                "IKEA",
                "CB2",
                "Article",
              ][index % 5],
              url: [
                "https://westelm.com",
                "https://rh.com",
                "https://ikea.com",
                "https://cb2.com",
                "https://article.com",
              ][index % 5],
            })
          );

          return Response.json({
            success: true,
            matches: enhancedResults,
          });
        } catch (error) {
          console.error("Search furniture error:", error);
          return Response.json(
            { success: false, error: "Search failed" },
            { status: 500 }
          );
        }
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
