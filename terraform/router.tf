resource "google_compute_router" "fis-g4-router" {
  name    = var.router_name
  region  = var.region
  network = "fis_g4_network_cd"

  bgp {
    asn = 64514
  }
}

resource "google_compute_subnetwork" "courses-service-subnetwork" {
  name          = "courses-service-subnetwork"
  ip_cidr_range = "10.0.60.0/24"
  region        = var.region
  network       = "fis_g4_network_cd"
}

resource "google_compute_router_nat" "fis-g4-cloud-nat" {
  name                               = var.cloud_nat_name
  router                             = google_compute_router.fis-g4-router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"

  subnetwork {
    name          = google_compute_subnetwork.courses-service-subnetwork.name
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}