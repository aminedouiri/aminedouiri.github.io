/**
 * ✏️  TECH & FRAMEWORK CATALOGUE
 *
 * Every entry appears in the "Tech" menu. Entries with a 3D shape get a landmark beside the road
 * (the shape is looked up by `id` in src/three/landmarks/index.js).
 *
 *   id     unique key (also the 3D shape key)
 *   mono   text on the original monogram badge (not an official logo)
 *   name   big title above the 3D landmark
 *   short  name in menus and panels
 *   cat    category; "framework" gets amber styling
 *   use    "How I use it" text — write your own
 *   parts  optional [title, description] cards shown in the panel
 *   alias  optional id of another entry whose landmark this one reuses (no own 3D shape)
 *   big    the large landmark at the start of the road
 *   size   optional size multiplier for a landmark (1 = normal)
 *   parkGap  optional extra distance (world units) between the landmark and where you park beside it
 */
export const tech = [
  { id: "loop", mono: "∞", name: "DEVOPS LOOP", short: "DevOps loop", cat: "framework", big: true,
    use: "How I work end to end: plan, code, build, test, release, deploy, operate and monitor, then feed what we learn back into the plan." },
  { id: "calms", mono: "CA", name: "CALMS", short: "CALMS", cat: "framework",
    use: "The five things I check when helping a team adopt DevOps. [Add an example from your work.]",
    parts: [["Culture", "Shared ownership of outcomes"], ["Automation", "Pipelines over manual steps"], ["Lean", "Small batches, less waste"], ["Measurement", "Decide with data"], ["Sharing", "Knowledge and tools across teams"]] },
  { id: "dora", mono: "DR", name: "DORA METRICS", short: "DORA metrics", cat: "framework",
    use: "The four numbers I use to show delivery is getting faster and safer. [Add your before / after.]",
    parts: [["Deploy frequency", "How often we ship"], ["Lead time", "Commit to production"], ["Change failure rate", "Deploys that cause incidents"], ["Time to restore", "How fast we recover"]] },
  { id: "sre", mono: "SRE", name: "SRE PYRAMID", short: "SRE pyramid", cat: "framework",
    use: "The reliability hierarchy I build from the bottom up: you can only improve what you can see.",
    parts: [["1 · Monitoring", "See what is happening"], ["2 · Incident response", "Act fast when it breaks"], ["3 · Postmortems", "Learn without blame"], ["4 · Testing & release", "Ship safely"], ["5 · Capacity planning", "Stay ahead of growth"], ["6 · Product", "Build on a reliable base"]] },
  { id: "ways", mono: "3W", name: "THE THREE WAYS", short: "Three Ways", cat: "framework",
    use: "The principles behind how I set up delivery: fast flow to production, fast feedback back to dev, and room to experiment and learn.",
    parts: [["1 · Flow", "Dev to production, smoothly"], ["2 · Feedback", "Production back to dev, quickly"], ["3 · Learning", "Experiment and improve"]] },
  { id: "devsecops", mono: "DSO", name: "DEVSECOPS", short: "DevSecOps", cat: "framework",
    use: "Security built into every step of the pipeline instead of a check at the end: scan early, block risky changes automatically, keep watching in production. [Add an example from your work.]",
    parts: [["SAST", "Scan source code on every commit"], ["Deps / SCA", "Known-vulnerable libraries"], ["Secrets", "No keys or passwords in Git"], ["IaC scan", "Misconfigured infrastructure"], ["DAST", "Test the running app"], ["Runtime", "Detect threats in production"]] },
  { id: "mlops", mono: "ML", name: "MLOPS", short: "MLOps", cat: "framework", size: 1.15, parkGap: 3.8,
    use: "DevOps for machine learning: versioned data, reproducible training, a model registry, automated deployment, and monitoring for drift that triggers retraining. [Add an example from your work.]",
    parts: [["Data", "Kafka event streams · DVC-versioned, validated datasets"], ["Features", "Feature store shared by training and serving"], ["Train", "Reproducible pipelines, runs tracked in MLflow"], ["Evaluate", "Gate on accuracy (and LLM evals) before release"], ["Registry", "Every model version tracked"], ["Serve", "vLLM on GPU nodes · Ollama for local models"], ["LLM apps", "MCP server for tools · vector DB for RAG"], ["Monitor & retrain", "Drift triggers a new cycle"]] },

  { id: "k8s", mono: "K8s", name: "KUBERNETES", short: "Kubernetes", cat: "orchestration", size: 1.3,
    use: "Run production services as Deployments with replicas behind Services, an Istio service mesh and an API gateway; autoscale with HPA, VPA and KEDA; ship with kubectl, Helm charts and Kustomize; persist data through a StorageClass on NFS; bootstrap and run clusters with kubeadm.",
    parts: [["Workloads", "Pod · Deployment · replicas"], ["Scaling", "HPA · VPA · KEDA"], ["Networking", "Service · CoreDNS · kube-proxy · Istio · API gateway"], ["Delivery", "kubectl · Helm charts · Kustomize"], ["Control plane", "kube-apiserver · etcd · controller-manager · kubeadm"], ["Nodes & storage", "kubelet · StorageClass · NFS"]] },
  { id: "docker", mono: "DK", name: "DOCKER", short: "Docker", cat: "containers", size: 1.15,
    use: "Containerise apps with small layered images, pull base images from Docker Hub, push to a local registry and publish to Docker Hub; run multi-service stacks with Docker Compose on their own network with volumes for data, and run local Kubernetes clusters with k3d.",
    parts: [["Images", "Layered builds · Docker Hub"], ["Registry", "Local registry · Docker Hub"], ["Compose", "Multi-container stacks"], ["Network", "Containers talk on a shared network"], ["Volumes", "Data survives container restarts"], ["k3d", "k3s Kubernetes running in Docker"]] },
  { id: "tf", mono: "TF", name: "TERRAFORM", short: "Terraform", cat: "infrastructure as code",
    use: "Define networks, compute and databases with my own reusable custom modules and deploy them multi-cloud from one workflow, across providers like Google Cloud, AWS, VMware vSphere, Kubernetes and Helm; every plan is saved to a Cloud Storage bucket alongside the remote state (with state locking), and state is backed up to a versioned bucket.",
    parts: [["Custom modules", "Reusable network, compute and database modules"], ["Multi-cloud providers", "Google Cloud · AWS · VMware vSphere · Kubernetes · Helm"], ["Plan", "Reviewed before every change, saved to the bucket"], ["Remote state", "Cloud Storage bucket with state locking"], ["Backup", "Versioned bucket keeps every state version"]] },
  { id: "cicd", mono: "CI", name: "CI/CD PIPELINE", short: "CI/CD pipeline", cat: "GitHub Actions · GitLab CI", size: 1.25, parkGap: 1.5,
    use: "I set up and run the pipelines for apps in many languages, Next.js, NestJS (microservices), ASP.NET, Django, Laravel, Express, React and Vue.js: each is built, tested, scanned and packaged with its own toolchain, deployed to Kubernetes, and runs its database migrations on PostgreSQL, MySQL or SQL Server. A failed test stops the pipeline, and a failed health check after deploy rolls back automatically to the previous version.",
    parts: [["Frontends", "Next.js · React · Vue.js"], ["Backends", "NestJS microservices · ASP.NET · Django · Laravel · Express"], ["Databases", "PostgreSQL · MySQL · SQL Server (migrations in the pipeline)"], ["Stages", "Build → test → scan → package → deploy"], ["Deploy", "Helm to Kubernetes"], ["When it fails", "Failed tests stop the pipeline · failed health check → automatic helm rollback"]] },
  { id: "gha", mono: "GH", alias: "cicd", short: "GitHub Actions", cat: "CI pipelines",
    use: "[Reusable workflows shared across N repositories; build, test and scan on every pull request.]" },
  { id: "gitlab", mono: "GL", alias: "cicd", short: "GitLab CI", cat: "CI pipelines",
    use: "[.gitlab-ci.yml pipelines with stages, runners and environments for review apps.]" },
  { id: "argo", mono: "ACD", name: "ARGO CD", short: "Argo CD", cat: "GitOps delivery", size: 1.15,
    use: "GitOps with GitLab and Argo CD: GitLab CI builds, tests and pushes the image, then commits the new tag to a GitOps config repo; Argo CD pulls that repo, syncs dev → staging → prod, and self-heals any manual drift back to what Git says.",
    parts: [["GitLab", "App repo + GitOps config repo"], ["GitLab CI", "Build → test → push, then bump the image tag"], ["Argo CD", "Pulls Git, compares, syncs"], ["Environments", "dev → staging → prod"], ["Self-heal", "Manual drift reverted to Git"]] },
  { id: "obs", mono: "OBS", name: "OBSERVABILITY", short: "Observability", cat: "OpenTelemetry · Prometheus · Jaeger · Loki · Grafana · Kafka", size: 1.3,
    use: "One observability stack for every service: apps are instrumented with the OpenTelemetry SDK, the OpenTelemetry Collector receives, processes and exports the signals, Prometheus stores metrics (queried with PromQL), Jaeger stores traces, Loki stores logs, and Grafana puts all three on one dashboard. Prometheus alert rules go to Alertmanager, which publishes alerts to a Kafka topic so consumers can notify by email, chat and on-call.",
    parts: [["OpenTelemetry", "SDK in every service + Collector"], ["Prometheus", "Metrics, PromQL queries and alert rules"], ["Jaeger", "Distributed traces"], ["Loki", "Centralised logs"], ["Grafana", "Dashboards on top of all three"], ["Alerting", "Prometheus rules → Alertmanager → Kafka → email · chat · on-call"]] },
  { id: "proxmox", mono: "PVE", name: "PROXMOX", short: "Proxmox", cat: "virtualization", size: 1.25,
    use: "Run a 3-node Proxmox VE cluster with KVM VMs and LXC containers on our own hardware (3 servers, each booting from two disks in RAID 1, plus 2 multi-disk storage arrays as shared storage): Corosync quorum and the HA manager restarting guests when a node fails, live migration, VLANs on Linux bridges behind the Proxmox firewall, templates with cloud-init, Proxmox Backup Server with deduplication, and automation through the API with Terraform.",
    parts: [["Compute", "KVM VMs · LXC containers"], ["Cluster", "Corosync quorum · HA manager · live migration"], ["Hardware", "3 servers · CPU · RAM · 2 boot disks in RAID 1"], ["Storage", "2 storage arrays (multi-disk), shared by all nodes"], ["Network", "Linux bridge vmbr0 · VLANs · firewall"], ["Provisioning", "Templates + cloud-init · API / Terraform"], ["Backup", "Proxmox Backup Server (deduplicated)"]] },
  { id: "vmware", mono: "VM", name: "VMWARE", short: "VMware", cat: "virtualization", size: 1.25,
    use: "Operate vSphere on our own hardware (3 servers, each booting from two disks in RAID 1, plus 2 multi-disk storage arrays as shared datastores): ESXi hosts managed by vCenter, with DRS balancing load through vMotion and HA restarting VMs when a host fails; NSX distributed switching and firewalling, VMs deployed from content-library templates, backups to a backup repository and vSphere Replication to a DR site.",
    parts: [["Cluster", "ESXi hosts · vCenter"], ["Availability", "HA restarts · DRS + vMotion"], ["Hardware", "3 servers · CPU · RAM · 2 boot disks in RAID 1"], ["Storage", "2 storage arrays (multi-disk) as shared datastores"], ["Network", "NSX distributed switch + firewall"], ["Provisioning", "Content-library templates"], ["Protection", "Backups · vSphere Replication to DR"]] },
  { id: "linux", mono: "LNX", name: "LINUX", short: "Linux", cat: "system administration", size: 1.3, parkGap: 2.5,
    use: "Administer Linux servers end to end: the filesystem hierarchy, users, groups and permissions, packages (dnf / apt), editing config with vim, services with systemd and logs with journalctl, processes (top, kill), disks with LVM, networking (ip, nmcli) behind firewalld zones, SSH key login, cron jobs and SELinux.",
    parts: [["Filesystem", "/etc · /home · /var · /usr · /boot · /opt · /tmp · /dev"], ["Users", "useradd · groups (wheel / sudo) · chown · chmod"], ["Services", "systemd units · journalctl logs"], ["Processes", "ps · top · kill · signals"], ["Packages & editor", "dnf / apt · vim"], ["Disks", "partitions · LVM (PV · VG · LV) · resize"], ["Network", "ip · nmcli · firewalld zones and services"], ["Also", "SSH keys · cron · SELinux"]] },
  { id: "net", mono: "NET", name: "NETWORKING", short: "Networking", cat: "routing · switching · services", size: 1.2,
    use: "Build and run LANs segmented into VLANs, with 802.1Q trunks between core and access switches; route with OSPF, EIGRP and BGP to the ISP; run the network services every company needs: DHCP, DNS and mail (SMTP, IMAP, POP3).",
    parts: [["Switching", "LAN · VLANs · 802.1Q trunk ports"], ["Routing", "OSPF · EIGRP · BGP"], ["Addressing", "DHCP (DORA) · DNS"], ["Mail", "SMTP · IMAP · POP3"], ["Security", "Edge firewall"]] },
  { id: "gcp", mono: "GCP", name: "GOOGLE CLOUD", short: "Google Cloud", cat: "cloud platform", size: 1.3,
    use: "Run services on Cloud Run, GKE and Compute Engine behind a load balancer and Cloud CDN, with data in Cloud SQL and Cloud Storage. Ship them with Cloud Build, Artifact Registry and Cloud Deploy, with Artifact Analysis and Binary Authorization guarding the supply chain; secure them with a VPC, firewall rules, IAM, a WireGuard VPN and Cloud Security; run them with Cloud Ops and budget alerts.",
    parts: [["Compute", "Cloud Run · GKE · Compute Engine"], ["Data", "Cloud SQL · Cloud Storage"], ["Delivery", "Cloud Build · Artifact Registry · Cloud Deploy"], ["Supply chain", "Artifact Analysis · Binary Authorization"], ["Edge", "Load balancer · Cloud CDN"], ["Network & security", "VPC · Firewall · IAM · WireGuard VPN · Cloud Security"], ["Cloud Ops", "Monitoring · Logging · Cloud Trace"], ["Cost", "Budget alerts"]] },
];

export const isFramework = (t) => t.cat === "framework";
