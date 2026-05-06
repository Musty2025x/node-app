# Production Node.js Web App with CI/CD on Azure VM + Custom Domain (IaaS)

## Real-World Scenario

> You've been hired as a DevOps Engineer at **TechieHub**. The team has a working Node.js app but deployments are manual, there's no custom domain, no HTTPS, and updates cause downtime.

**Your task:** Deploy the app on a cloud VM, set up CI/CD for automatic updates, connect a custom domain, and secure it with HTTPS — with zero manual intervention on every code push.

---

## Architecture

```
Developer (VS Code)
       │
       │  git push origin master
       ▼
GitHub Repository (Musty2025x/node-app)
       │
       │  Triggers GitHub Actions workflow
       ▼
GitHub Actions (deploy.yml)
       │
       │  appleboy/ssh-action → SSH into VM
       ▼
Azure VM — Ubuntu 24.04 (node-app-vm)
       │
       ├── PM2        → runs Node.js app on port 3000
       ├── Nginx      → reverse proxy (port 80/443 → 3000)
       └── Certbot    → free SSL certificate (Let's Encrypt)
       │
       ▼
https://www.mustydevops.com.ng
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Application | Node.js + Express |
| Source Control | GitHub |
| CI/CD | GitHub Actions + `appleboy/ssh-action` |
| Cloud Hosting | Azure VM — Ubuntu 24.04 LTS (B1s) |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt via Certbot |
| Domain | Qservers (or any domain registrar) |

---

## Prerequisites

- Azure account with active subscription
- GitHub account
- Node.js installed locally
- Domain name (e.g. `mustydevops.com.ng`)
- SSH client — Git Bash or Terminal

---

## Phase 1 — Create the Application

### Step 1 — Create the project

```bash
mkdir node-app
cd node-app
npm init -y
```

## screenshot of npm init output

![alt text](<asset/Screenshot 2026-05-06 132949.png>)

### Step 2 — Install Express

```bash
npm install express
```

### Step 3 — Create `index.js`

```javascript
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🚀 DevOps Capstone App is Running!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 4 — Update `package.json`

Add a `start` script inside the `scripts` section:

```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
  "start": "node index.js"
}
```

### Step 5 — Test locally

```bash
npm start
```

Visit **http://localhost:3000** — you should see:
```
🚀 DevOps Capstone App is Running!
```

## screenshot of local app running
![alt text](<asset/Screenshot 2026-05-06 133531.png>)

---

## Phase 2 — Push to GitHub

### Step 6 — Initialise Git

Create a `.gitignore` file in the project root:

```
node_modules/
.env
.DS_Store
npm-debug.log
```

Then initialise and commit:

```bash
git init
git add .
git commit -m "initial commit"
```

### Step 7 — Push to GitHub

1. Create a new repository on [github.com](https://github.com) named `node-app`
2. Push your code:

```bash
git remote add origin https://github.com/YOUR-USERNAME/node-app.git
git push origin master
```

## screenshot of GitHub repo with code
![alt text](<asset/Screenshot 2026-05-06 133904.png>)

---

## Phase 3 — Create Azure VM

### Step 8 — Create the Virtual Machine

1. Go to **Azure Portal → Virtual Machines → Create**
2. Configure:

| Field | Value |
|---|---|
| Resource Group | `nodeRG` (create new) |
| Virtual Machine Name | `node-app-vm` |
| Region | West US 3 |
| OS Image | Ubuntu 24.04 LTS |
| Size | B1s |
| Authentication | SSH public key |
| Username | `azureuser` |
| Inbound ports | 22 (SSH), 80 (HTTP), 443 (HTTPS) |

3. Click **Review + Create → Create**
4. **Download the private key** when prompted — you will not be able to download it again

## screenshot of Azure VM creation
![alt text](<asset/Screenshot 2026-05-06 134502.png>)
![alt text](<asset/Screenshot 2026-05-06 134536.png>)
![alt text](<asset/Screenshot 2026-05-06 134554.png>)
![alt text](<asset/Screenshot 2026-05-06 142712.png>)

### Step 9 — Connect via SSH

```bash
ssh -i <path-to-private-key> azureuser@YOUR_PUBLIC_IP
```

Example:
```bash
ssh -i ~/Downloads/node-app-vm_key.pem azureuser@20.120.170.68
```
## screenshot of SSH connection
![alt text](<asset/Screenshot 2026-05-06 142913.png>)

---

## Phase 4 — Set Up the Server

### Step 10 — Install Dependencies on the VM

```bash
# Update packages
sudo apt update
sudo apt upgrade -y
```
![alt text](<asset/Screenshot 2026-05-06 143017.png>)
![alt text](<asset/Screenshot 2026-05-06 143038.png>)
![alt text](<asset/Screenshot 2026-05-06 143132.png>)
![alt text](<asset/Screenshot 2026-05-06 143201.png>)

**Install Node.js** — choose v20 (recommended, avoids deprecation warnings):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

![alt text](<asset/Screenshot 2026-05-06 143315.png>)
![alt text](<asset/Screenshot 2026-05-06 143337.png>)
![alt text](<asset/Screenshot 2026-05-06 143435.png>)
![alt text](<asset/Screenshot 2026-05-06 143454.png>)

**Install Nginx:**

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```
![alt text](<asset/Screenshot 2026-05-06 143544.png>)
![alt text](<asset/Screenshot 2026-05-06 143635.png>)
![alt text](<asset/Screenshot 2026-05-06 143724.png>)
![alt text](<asset/Screenshot 2026-05-06 143931.png>)

**Install PM2:**

```bash
sudo npm install -g pm2
```
![alt text](<asset/Screenshot 2026-05-06 144008.png>)

---

## Phase 5 — Deploy the Application

### Step 11 — Clone the repository on the VM

```bash
git clone https://github.com/Musty2025x/node-app.git
cd node-app
```

### Step 12 — Install dependencies and start with PM2

```bash
npm install
pm2 start index.js --name my-app
pm2 save
pm2 startup
```

> **Run the command that `pm2 startup` outputs** — it registers PM2 as a system service so the app restarts automatically after a VM reboot.

![alt text](<asset/Screenshot 2026-05-06 144536.png>)
![alt text](<asset/Screenshot 2026-05-06 144556.png>)
![alt text](<asset/Screenshot 2026-05-06 144616.png>)
![alt text](<asset/Screenshot 2026-05-06 144717.png>)

---

## Phase 6 — Configure Nginx

### Step 13 — Set up reverse proxy

```bash
sudo vim /etc/nginx/sites-available/default
```

Delete all existing content and replace with:

```nginx
server {
    listen 80;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

Save with `:wq`, then restart Nginx:

```bash
sudo systemctl restart nginx
```

Test by visiting **http://YOUR_PUBLIC_IP** in a browser — the Node.js app should load.

> **Note:** Make sure you visit using `http://` not `https://` at this stage — SSL is configured later.


![alt text](<asset/Screenshot 2026-05-06 145125.png>)

---

## Phase 7 — Set Up CI/CD

### Step 14 — Add GitHub Secrets

In your GitHub repository go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret Name | Value |
|---|---|
| `VM_IP` | Your VM public IP (e.g. `20.120.170.68`) |
| `VM_USER` | `azureuser` |
| `SSH_PRIVATE_KEY` | Full contents of your private key file (including header and footer) |

> **For `SSH_PRIVATE_KEY`:** Open the downloaded `.pem` file, copy the entire contents including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` and paste into the secret value.

## screenshot of GitHub secrets
![alt text](<asset/Screenshot 2026-05-06 145749.png>)

### Step 15 — Create the GitHub Actions workflow

Create the file `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to Azure VM

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v0.1.6
        with:
          host: ${{ secrets.VM_IP }}
          username: ${{ secrets.VM_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: 22
          script_stop: true
          script: |
            cd node-app
            git pull origin master
            npm install
            pm2 describe my-app > /dev/null 2>&1 && pm2 restart my-app || pm2 start index.js --name my-app
            pm2 save
```

> **Why `pm2 describe ... && pm2 restart || pm2 start`?** This handles both the first deployment (no process exists yet) and all subsequent deployments (process already running) without failing.

### Step 16 — Test CI/CD

Pull the new workflow file then push a change:

```bash
git pull origin master
git add .
git commit -m "test deploy"
git push origin master
```

Go to **GitHub → Actions** and watch the workflow run. Once complete, refresh your VM IP in the browser — the change is live.

## screenshot of GitHub Actions workflow
![alt text](<asset/Screenshot 2026-05-06 161618.png>)

## screenshot of updated app in browser
![alt text](<asset/Screenshot 2026-05-06 161650.png>)

---

## Phase 8 — Connect Custom Domain

### Step 17 — Add DNS Records at your registrar

Log in to your domain registrar (Qservers, Namecheap, GoDaddy, etc.) and add:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `YOUR_VM_IP` |
| `A` | `www` | `YOUR_VM_IP` |

Wait **5–30 minutes** for DNS propagation before proceeding.

## screenshot of DNS records
![alt text](<asset/Screenshot 2026-05-06 162053.png>)

---

## Phase 9 — Configure Domain in Nginx

### Step 18 — Update Nginx config with domain name

```bash
sudo vim /etc/nginx/sites-available/default
```

Replace the content with:

```nginx
server {
    listen 80;
    server_name mustydevops.com www.mustydevops.com.ng;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

## screenshot of Nginx config with domain
![alt text](<asset/Screenshot 2026-05-06 162520.png>)

Restart Nginx:

```bash
sudo systemctl restart nginx
```

![alt text](<asset/Screenshot 2026-05-06 162657.png>)


Visit **http://yourdomain.com** — the app should load on your custom domain.

## screenshot of app on custom domain
![alt text](<asset/Screenshot 2026-05-06 162749.png>)

---

## Phase 10 — Enable HTTPS

### Step 19 — Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

## screenshot of Certbot installation
![alt text](<asset/Screenshot 2026-05-06 162846.png>)
![alt text](<asset/Screenshot 2026-05-06 162927.png>)

### Step 20 — Run SSL setup

```bash
sudo certbot --nginx
```

## screenshot of Certbot setup
![alt text](<asset/Screenshot 2026-05-06 163311.png>)
![alt text](<asset/Screenshot 2026-05-06 163331.png>)

Follow the prompts — Certbot will:
- Automatically detect your domain from the Nginx config
- Request a free Let's Encrypt certificate
- Update the Nginx config to redirect HTTP → HTTPS
- Schedule automatic certificate renewal

Visit **https://yourdomain.com** — the padlock confirms HTTPS is active.

## screenshot of app on HTTPS
![alt text](<asset/Screenshot 2026-05-06 163417.png>)

---

## Phase 11 — Test Full CI/CD Pipeline with HTTPS

### Step 21 — End-to-end test

Make a change to `index.js`:

```javascript
app.get('/', (req, res) => {

    res.send('🚀 Final Test of New DevOps Capstone App is Running!');

});
```

![alt text](<asset/Screenshot 2026-05-06 163608.png>)

Push the change:

```bash
git add .
git commit -m "Committing final changes"
git push origin master
```
## screenshot of GitHub commit
![alt text](<asset/Screenshot 2026-05-06 163717.png>)

Your complete automated flow:

```
git push
   │
   ▼  GitHub Actions triggers
SSH into VM → git pull → npm install → pm2 restart
   │
   ▼  Instantly live
https://mustydevops.com.ng ✅
https://www.mustydevops.com.ng ✅
```
## screenshot of updated app on HTTPS
![alt text](<asset/Screenshot 2026-05-06 163843.png>)

---

## Output

### GitHub Actions — Successful Pipeline Run

![alt text](<asset/Screenshot 2026-05-06 163750.png>)

```
======CMD======
cd node-app
git pull origin master
npm install
pm2 describe my-app > /dev/null 2>&1 && pm2 restart my-app || pm2 start index.js --name my-app
pm2 save

======END======
err: From https://github.com/Musty2025x/node-app
err:  * branch            master     -> FETCH_HEAD
err:    eca1d78..f5460b5  master     -> origin/master
out: Updating eca1d78..f5460b5
out: Fast-forward
out:  index.js | 2 +-
out:  1 file changed, 1 insertion(+), 1 deletion(-)
out: up to date, audited 66 packages in 410ms
out: 22 packages are looking for funding
out:   run `npm fund` for details
out: found 0 vulnerabilities
out: Use --update-env to update environment variables
out: [PM2] Applying action restartProcessId on app [my-app](ids: [ 0 ])
out: [PM2] [my-app](0) ✓
out: ┌────┬───────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
out: │ id │ name      │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
out: ├────┼───────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
out: │ 0  │ my-app    │ default     │ 1.0.0   │ fork    │ 2761     │ 0s     │ 2    │ online    │ 0%       │ 17.6mb   │ azureus… │ disabled │
out: └────┴───────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
out: [PM2] Saving current process list...
out: [PM2] Successfully saved in /home/***/.pm2/dump.pm2
==============================================
✅ Successfully executed commands to all host.
==============================================
```

### PM2 Process Status

```bash
pm2 list
```

```
┌─────┬──────────┬─────────┬──────┬───────────┬──────────┐
│ id  │ name     │ status  │ cpu  │ memory    │ uptime   │
├─────┼──────────┼─────────┼──────┼───────────┼──────────┤
│ 0   │ my-app   │ online  │ 0%   │ 45mb      │ 5m       │
└─────┴──────────┴─────────┴──────┴───────────┴──────────┘
```

### GitHub Repository Secrets

| Secret | Purpose |
|---|---|
| `VM_IP` | Azure VM public IP address |
| `VM_USER` | SSH username (`azureuser`) |
| `SSH_PRIVATE_KEY` | Ed25519 private key for passwordless SSH auth |

### DNS Records

| Type | Name | Value | Purpose |
|---|---|---|---|
| `A` | `@` | `20.120.170.68` | Root domain → VM |
| `A` | `www` | `20.120.170.68` | www subdomain → VM |

---

## Errors & Fixes

### ❌ 1 — `i/o timeout` on SSH action

**Cause:** GitHub Actions runner could not reach the VM on port 22 — either the VM was stopped or the SSH service was not running.

**Fix:**
```bash
# Via Azure Serial Console — restart SSH service
sudo systemctl start sshd
sudo systemctl enable sshd
```

Also set a **static public IP** on the VM to prevent the IP changing on reboot:
**Azure Portal → VM → Networking → Public IP → Configuration → Static**

---

### ❌ 2 — `ssh: unable to authenticate` (publickey)

**Cause:** The private key in the `SSH_PRIVATE_KEY` secret used the old RSA format (`-----BEGIN RSA PRIVATE KEY-----`) which is incompatible with `appleboy/ssh-action`.

**Fix:** Generate a new Ed25519 key pair and add the public key to the VM:

```bash
# Generate new key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key

# Add public key to VM (via Azure Serial Console)
echo "$(cat ~/.ssh/github_actions_key.pub)" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Update `SSH_PRIVATE_KEY` secret with the contents of `~/.ssh/github_actions_key` (starts with `-----BEGIN OPENSSH PRIVATE KEY-----`).

---

### ❌ 3 — `PM2 Process or Namespace my-app not found`

**Cause:** `pm2 restart my-app` was called on first deployment when no PM2 process existed yet.

**Fix:** Use a conditional start/restart command:

```bash
pm2 describe my-app > /dev/null 2>&1 && pm2 restart my-app || pm2 start index.js --name my-app
```

---

### ❌ 4 — `npm install → ENOENT (package.json not found)`

**Cause:** Running `npm install` from the wrong directory.

**Fix:**
```bash
pwd          # confirm you are in the right directory
ls           # confirm package.json is present
cd node-app  # navigate to correct folder if needed
```

---

### ❌ 5 — `502 Bad Gateway` (Nginx)

**Cause:** Nginx is running but the Node.js app on port 3000 is not.

**Fix:**
```bash
pm2 status           # check if my-app is online
pm2 restart my-app   # restart if stopped or errored
pm2 logs my-app      # check for application errors
```

---

### ❌ 6 — Certbot SSL Error (NXDOMAIN)

**Cause:** DNS records had not propagated, or an incorrect domain was entered during Certbot setup.

**Fix:**
- Verify DNS records are correct at your registrar
- Wait 10–30 minutes for propagation
- Use the exact domain configured in Nginx `server_name`
- Re-run `sudo certbot --nginx` after DNS propagates

---

## Cleanup

To avoid ongoing Azure charges after the lab:

1. Go to **Azure Portal → Resource Groups**
2. Select `nodeRG`
3. Click **Delete resource group**
4. Confirm by typing the resource group name

## screenshot of Azure resource group deletion
![alt text](<asset/Screenshot 2026-05-06 165858.png>)

---

## Project Summary  

| Component | Detail |
|---|---|
| Application | Node.js + Express — health endpoint at `/health` |
| Repository | `github.com/Musty2025x/node-app` |
| CI/CD | GitHub Actions — SSH deploy via `appleboy/ssh-action@v0.1.6` |
| VM | Azure — Ubuntu 24.04 LTS — B1s — West US 3 |
| Process Manager | PM2 — auto-restart on crash and VM reboot |
| Reverse Proxy | Nginx — port 80/443 → localhost:3000 |
| SSL | Let's Encrypt (free, auto-renewed by Certbot) |
| Custom Domain | `https://www.mustydevops.com.ng` |

---

## References

- [appleboy/ssh-action](https://github.com/appleboy/ssh-action)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Reverse Proxy Guide](https://nginx.org/en/docs/beginners_guide.html)
- [Certbot — Let's Encrypt](https://certbot.eff.org/)
- [Azure VM Documentation](https://learn.microsoft.com/en-us/azure/virtual-machines/)
- [Node.js on Ubuntu — NodeSource](https://github.com/nodesource/distributions)