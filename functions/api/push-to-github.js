import { createPlatform } from "../_shared/platform.js";
const OWNER = "biedavinc-cloud";
const REPO = "Liafrik-command-center";
async function gh(url, method, ghHeaders, body) {
  const res = await fetch(url, { method, headers: ghHeaders, body: body ? JSON.stringify(body) : void 0 });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  return { ok: res.ok, status: res.status, data };
}
async function onRequestPost({ request: req, env }) {
  const steps = [];
  try {
    const platform = createPlatform(req, env);
    const user = await platform.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
    let accessToken;
    try {
      const conn = await platform.asServiceRole.connectors.getConnection("github");
      accessToken = conn.accessToken;
    } catch (e) {
      return Response.json({ error: `GitHub connection failed: ${e.message}` }, { status: 500 });
    }
    if (!accessToken) return Response.json({ error: "No GitHub access token" }, { status: 500 });
    const ghHeaders = {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Liafrik-Command-Center/1.0"
    };
    const userResp = await gh("https://api.github.com/user", "GET", ghHeaders);
    steps.push(`github_user:${userResp.status}`);
    if (!userResp.ok) return Response.json({ error: `GitHub auth failed: ${userResp.data?.message || userResp.data?.raw}`, steps }, { status: 500 });
    const ghUsername = userResp.data.login;
    const checkResp = await gh(`https://api.github.com/repos/${OWNER}/${REPO}`, "GET", ghHeaders);
    steps.push(`repo_check:${checkResp.status}`);
    if (!checkResp.ok) {
      let createUrl, createBody;
      if (ghUsername === OWNER) {
        createUrl = "https://api.github.com/user/repos";
        createBody = { name: REPO, private: true, description: "Liafrik Command Center \u2014 Enterprise Control Plane" };
      } else {
        createUrl = `https://api.github.com/orgs/${OWNER}/repos`;
        createBody = { name: REPO, private: true, description: "Liafrik Command Center \u2014 Enterprise Control Plane" };
      }
      const createResp = await gh(createUrl, "POST", ghHeaders, createBody);
      steps.push(`repo_create:${createResp.status}`);
      if (!createResp.ok && createResp.status !== 422) {
        return Response.json({ error: `Repo creation failed: ${createResp.data?.message || createResp.data?.raw}`, steps }, { status: 500 });
      }
    }
    const body = await req.json();
    const files = body.files || [];
    if (!files.length) return Response.json({ error: "No files provided", steps }, { status: 400 });
    steps.push(`files:${files.length}`);
    let parentSha = null;
    let baseTreeSha = null;
    const refResp = await gh(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/main`, "GET", ghHeaders);
    steps.push(`ref_check:${refResp.status}`);
    if (refResp.ok) {
      parentSha = refResp.data.object?.sha;
      if (parentSha) {
        const commitResp2 = await gh(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits/${parentSha}`, "GET", ghHeaders);
        if (commitResp2.ok) baseTreeSha = commitResp2.data.tree?.sha;
      }
    }
    const blobShas = {};
    const batchSize = 25;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      await Promise.all(batch.map(async (file) => {
        const blobResp = await gh(`https://api.github.com/repos/${OWNER}/${REPO}/git/blobs`, "POST", ghHeaders, {
          content: file.content,
          encoding: file.encoding || "utf-8"
        });
        if (!blobResp.ok) throw new Error(`Blob failed for ${file.path}: ${blobResp.data?.message || blobResp.status}`);
        blobShas[file.path] = blobResp.data.sha;
      }));
    }
    steps.push(`blobs_created:${Object.keys(blobShas).length}`);
    const treeEntries = Object.entries(blobShas).map(([p, sha]) => ({ path: p, mode: "100644", type: "blob", sha }));
    const treeBody = { tree: treeEntries };
    if (baseTreeSha) treeBody.base_tree = baseTreeSha;
    const treeResp = await gh(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees`, "POST", ghHeaders, treeBody);
    steps.push(`tree_create:${treeResp.status}`);
    if (!treeResp.ok) return Response.json({ error: `Tree failed: ${treeResp.data?.message || treeResp.data?.raw}`, steps }, { status: 500 });
    const commitBody = { message: "feat: Liafrik Command Center \u2014 full system push", tree: treeResp.data.sha };
    if (parentSha) commitBody.parents = [parentSha];
    const commitResp = await gh(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits`, "POST", ghHeaders, commitBody);
    steps.push(`commit_create:${commitResp.status}`);
    if (!commitResp.ok) return Response.json({ error: `Commit failed: ${commitResp.data?.message || commitResp.data?.raw}`, steps }, { status: 500 });
    if (parentSha) {
      await gh(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/main`, "PATCH", ghHeaders, { sha: commitResp.data.sha });
    } else {
      await gh(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs`, "POST", ghHeaders, { ref: "refs/heads/main", sha: commitResp.data.sha });
    }
    steps.push(`ref_updated`);
    return Response.json({
      success: true,
      commitSha: commitResp.data.sha,
      fileCount: files.length,
      repoUrl: `https://github.com/${OWNER}/${REPO}`,
      steps
    });
  } catch (error) {
    return Response.json({ error: error.message, steps }, { status: 500 });
  }
}
export {
  onRequestPost
};
