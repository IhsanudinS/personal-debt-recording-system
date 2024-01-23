document.addEventListener("DOMContentLoaded", function () {
  const hutangForm = document.getElementById("hutangForm");
  const filterForm = document.getElementById("filterForm");
  const daftarHutangBody = document.getElementById("daftarHutangBody");
  const formPembayaran = document.getElementById("formPembayaran");

  // Memeriksa apakah ada data daftar hutang di sessionStorage
  let daftarHutangData =
    JSON.parse(sessionStorage.getItem("daftarHutang")) || [];

  // Fungsi untuk menampilkan daftar hutang ke dalam tabel
  function tampilkanDaftarHutang() {
    daftarHutangBody.innerHTML = "";

    daftarHutangData.forEach((data, index) => {
      const statusWarna = getStatusWarna(data.status);

      const daftarHutangRow = document.createElement("tr");
      daftarHutangRow.innerHTML = `
      <td>${data.namaPemberiPinjaman}</td>
      <td>${data.nominalHutang}</td>
      <td>${data.tanggalHutang}</td>
      <td>${data.tanggalBayar}</td>
      <td>${data.tujuanHutang}</td>
      <td class="${statusWarna}">${getStatusLabel(data)}</td>
      <td>
      <button class="btn btn-success bayar-button" data-toggle="modal" data-target="#modalPembayaran" data-index="${index}" ${
        data.status === "lunas" ? 'style="display:none;"' : ""
      }>Bayar</button>
      <button class="btn btn-danger hapus-button" data-index="${index}" ${
        data.status !== "lunas" ? 'style="display:none;"' : ""
      }>Hapus</button>
      </td>
  `;

      // Menambahkan baris ke dalam tabel
      daftarHutangBody.appendChild(daftarHutangRow);
    });
  }

  // Fungsi untuk mendapatkan warna sesuai dengan status
  function getStatusWarna(status) {
    switch (status) {
      case "lunas":
        return "text-success";
      case "kurang":
        return "text-warning";
      default:
        return "text-danger";
    }
  }

  // Fungsi untuk mendapatkan label sesuai dengan status
  function getStatusLabel(data) {
    switch (data.status) {
      case "lunas":
        return data.status;
      case "kurang":
        return `${data.status} (Kekurangan Rp.${data.kekurangan})`;
      default:
        return data.status;
    }
  }

  // Fungsi untuk menangani perubahan nilai pada form filter
  function filterData() {
    const filterStatus = document.getElementById("filterStatus").value;

    // Menerapkan filter sesuai status
    let filteredData;
    if (filterStatus !== "semua") {
      filteredData = daftarHutangData.filter(
        (data) => data.status === filterStatus
      );
    } else {
      filteredData = JSON.parse(sessionStorage.getItem("daftarHutang")) || [];
    }

    // Menampilkan daftar hutang sesuai dengan filter
    daftarHutangData = filteredData;
    tampilkanDaftarHutang();
  }

  // Fungsi untuk menangani klik tombol bayar
  function handleBayarButtonClick(index) {
    // Mengisi nilai form pembayaran sesuai data hutang yang dipilih
    const selectedData = daftarHutangData[index];
    document.getElementById("tujuanHutang").value = selectedData.tujuanHutang;
    document.getElementById("nominalPembayaran").value =
      selectedData.nominalHutang;
    document.getElementById("tanggalPembayaran").value = getCurrentDate();
    document.getElementById("caraBayar").value = ""; // Ganti dengan nilai default jika ada

    // Menangani submit form pembayaran
    formPembayaran.addEventListener("submit", function (event) {
      event.preventDefault();

      // Mendapatkan nilai dari form pembayaran
      const namaPemberiHutang =
        document.getElementById("namaPemberiHutang").value;
      const tujuanHutang = document.getElementById("tujuanHutang").value;
      const nominalPembayaran = parseFloat(
        document.getElementById("nominalPembayaran").value
      );
      const tanggalPembayaran =
        document.getElementById("tanggalPembayaran").value;
      const caraBayar = document.getElementById("caraBayar").value;
      // Tambahkan kode untuk mendapatkan nilai dari input file (buktiPembayaran) jika dibutuhkan

      // Menambahkan data pembayaran ke dalam histori pembayaran
      const historiPembayaranData =
        JSON.parse(sessionStorage.getItem("historiPembayaran")) || [];
      historiPembayaranData.push({
        namaPemberiHutang: namaPemberiHutang,
        nominalPembayaran: nominalPembayaran,
        tujuanHutang: tujuanHutang,
        tanggalPembayaran: tanggalPembayaran,
        caraBayar: caraBayar,
        // Tambahkan properti buktiPembayaran jika dibutuhkan
      });
      sessionStorage.setItem(
        "historiPembayaran",
        JSON.stringify(historiPembayaranData)
      );

      // Menampilkan kembali histori pembayaran setelah submit
      tampilkanHistoriPembayaran();

      // Menangani perubahan status hutang sesuai dengan pembayaran
      if (nominalPembayaran >= selectedData.nominalHutang) {
        // Jika pembayaran sesuai atau lebih, status menjadi 'lunas'
        selectedData.status = "lunas";
        // Set nominal hutang yang sudah dibayar
        selectedData.nominalDibayar = selectedData.nominalHutang;
        // Reset kekurangan
        selectedData.kekurangan = 0;
      } else {
        // Jika pembayaran kurang, status menjadi 'kurang'
        selectedData.status = "kurang";
        // Set nominal hutang yang sudah dibayar
        selectedData.nominalDibayar = nominalPembayaran;
        // Menambahkan informasi kekurangan di status
        selectedData.kekurangan =
          selectedData.nominalHutang - nominalPembayaran;
      }

      // Mengurangi nilai nominal hutang dengan nominal yang sudah dibayar
      selectedData.nominalHutang -= selectedData.nominalDibayar;

      // Menyimpan data daftar hutang ke sessionStorage
      sessionStorage.setItem("daftarHutang", JSON.stringify(daftarHutangData));

      // Menutup modal pembayaran
      $("#modalPembayaran").modal("hide");

      // Menampilkan kembali daftar hutang
      tampilkanDaftarHutang();
    });
  }

  // Fungsi untuk mendapatkan tanggal saat ini
  function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Mendengarkan event submit pada form hutang
  hutangForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Mencegah pengiriman form secara default

    // Mendapatkan nilai dari form
    const namaPemberiPinjaman = document.getElementById(
      "namaPemberiPinjaman"
    ).value;
    const nominalHutang = document.getElementById("nominalHutang").value;
    const tanggalHutang = document.getElementById("tanggalHutang").value;
    const tanggalBayar = document.getElementById("tanggalBayar").value;
    const tujuanHutang = document.getElementById("tujuanHutang").value;

    // Menambahkan data baru ke dalam array daftarHutangData
    daftarHutangData.push({
      namaPemberiPinjaman,
      nominalHutang,
      tanggalHutang,
      tanggalBayar,
      tujuanHutang,
      status: "belum lunas", // Menambahkan status default
      kekurangan: 0, // Menambahkan kekurangan default
    });

    // Menyimpan data daftar hutang ke sessionStorage
    sessionStorage.setItem("daftarHutang", JSON.stringify(daftarHutangData));

    // Menampilkan kembali daftar hutang
    tampilkanDaftarHutang();

    // Mengosongkan form setelah submit
    hutangForm.reset();
  });

  // Mendengarkan event klik pada tombol bayar
  daftarHutangBody.addEventListener("click", function (event) {
    if (event.target.classList.contains("bayar-button")) {
      const dataIndex = event.target.getAttribute("data-index");
      handleBayarButtonClick(dataIndex);
    }
  });

  // Mendengarkan event klik pada tombol hapus
  daftarHutangBody.addEventListener("click", function (event) {
    if (event.target.classList.contains("hapus-button")) {
      const dataIndex = event.target.getAttribute("data-index");
      // Hapus data sesuai index
      daftarHutangData.splice(dataIndex, 1);
      // Simpan data daftar hutang ke sessionStorage
      sessionStorage.setItem("daftarHutang", JSON.stringify(daftarHutangData));
      // Tampilkan kembali daftar hutang
      tampilkanDaftarHutang();
    }
  });

  // Fungsi untuk mengekspor data ke dalam format Excel
  function exportToExcel() {
    const filterStatus = document.getElementById("filterStatus").value;

    // Menerapkan filter sesuai status
    let filteredData;
    if (filterStatus !== "semua") {
      filteredData = daftarHutangData.filter(
        (data) => data.status === filterStatus
      );
    } else {
      filteredData = daftarHutangData;
    }

    // Membuat worksheet Excel dari data yang difilter
    const ws = XLSX.utils.json_to_sheet(filteredData);

    // Membuat workbook dan menambahkan worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DaftarHutang");

    // Menyimpan workbook ke dalam file Excel
    XLSX.writeFile(wb, "DaftarHutang.xlsx");
  }

  // Fungsi untuk menampilkan histori pembayaran
  function tampilkanHistoriPembayaran() {
    const historiPembayaranDiv = document.getElementById("historiPembayaran");
    historiPembayaranDiv.innerHTML = ""; // Bersihkan kontennya

    // Tambahkan label "Histori Pembayaran" di atas tabel
    const labelHistori = document.createElement("h4");
    labelHistori.textContent = "Histori Pembayaran";
    historiPembayaranDiv.appendChild(labelHistori);

    // Buat tabel untuk menampilkan histori pembayaran
    const tabelHistori = document.createElement("table");
    tabelHistori.classList.add("table", "table-striped", "mt-3");
    tabelHistori.innerHTML = `
  <thead>
    <tr>
      <th>Nama Pemberi Hutang</th>
      <th>Nominal Pembayaran</th>
      <th>Tujuan Hutang</th>
      <th>Tanggal Pembayaran</th>
      <th>Cara Bayar</th>
      <th>Bukti Pembayaran</th>
      <th>Share</th>
      <th>Hapus</th>
    </tr>
  </thead>
  <tbody>
    <!-- Isi tabel histori akan diisi disini -->
  </tbody>
`;

    // Menambahkan tabel histori ke dalam div
    historiPembayaranDiv.appendChild(tabelHistori);

    // Mengambil data dari form pembayaran yang disimpan di sessionStorage
    const historiPembayaranData =
      JSON.parse(sessionStorage.getItem("historiPembayaran")) || [];

    // Menyusun baris-baris dalam tabel histori
    historiPembayaranData.forEach((data) => {
      const barisTabel = document.createElement("tr");
      barisTabel.innerHTML = `
    <td>${data.namaPemberiHutang}</td>
    <td>${data.nominalPembayaran}</td>
    <td>${data.tujuanHutang}</td>
    <td>${data.tanggalPembayaran}</td>
    <td>${data.caraBayar}</td>
    <td>
      ${
        data.buktiPembayaran
          ? `<img src="${data.buktiPembayaran}" alt="Bukti Pembayaran" style="max-width: 100px; max-height: 100px;">`
          : "-"
      }
    </td>
    <td>
      <button class="btn btn-info share-button" data-index="${historiPembayaranData.indexOf(
        data
      )}">Share</button>
    </td>
    <td>
      <button class="btn btn-danger hapus-button" data-index="${historiPembayaranData.indexOf(
        data
      )}">Hapus</button>
    </td>
  `;

      tabelHistori.querySelector("tbody").appendChild(barisTabel);
    });

    // Fungsi untuk menangani klik tombol Hapus di tabel hutang
    function handleHapusHutangClick(index) {
      const konfirmasi = confirm("Apakah Anda yakin ingin menghapus data ini?");
      if (konfirmasi) {
      }
      // Hapus data sesuai index
      daftarHutangData.splice(index, 1);
      // Simpan data daftar hutang ke sessionStorage
      sessionStorage.setItem("daftarHutang", JSON.stringify(daftarHutangData));
      // Tampilkan kembali daftar hutang
      tampilkanDaftarHutang();
    }

    // Fungsi untuk menangani klik tombol Hapus di tabel histori pembayaran
    function handleHapusHistoriClick(index) {
      // Konfirmasi sebelum menghapus
      const konfirmasi = confirm(
        "Apakah Anda yakin ingin menghapus histori ini?"
      );
      if (konfirmasi) {
        // Hapus histori dan tampilkan kembali tabel histori
        historiPembayaranData.splice(index, 1);
        sessionStorage.setItem(
          "historiPembayaran",
          JSON.stringify(historiPembayaranData)
        );
        tampilkanHistoriPembayaran();
      }
    }

    // Menangani klik tombol Hapus di setiap baris tabel hutang
    daftarHutangBody.addEventListener("click", function (event) {
      if (event.target.classList.contains("hapus-button")) {
        const dataIndex = event.target.getAttribute("data-index");
        handleHapusHutangClick(dataIndex);
      }
    });

    // Menangani klik tombol Hapus di setiap baris tabel histori
    const hapusButtons = document.querySelectorAll(".hapus-button");
    hapusButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const index = this.getAttribute("data-index");
        handleHapusHistoriClick(index);
      });
    });

    // Menangani klik tombol Share di setiap baris tabel histori
    const shareButtons = document.querySelectorAll(".share-button");
    shareButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const index = this.getAttribute("data-index");
        const dataToShare = historiPembayaranData[index];

        // Memanggil fungsi untuk menampilkan popup aplikasi share
        tampilkanPopupShare(dataToShare);
      });
    });
  }

  // Fungsi untuk menampilkan popup aplikasi share
  function tampilkanPopupShare(data) {
    if (navigator.share) {
      // Browser mendukung Web Share API
      navigator
        .share({
          title: "Histori Pembayaran",
          text: `Nama: ${data.namaPemberiHutang}\nNominal: ${data.nominalPembayaran}\nTujuan Hutang: ${data.tujuanHutang}\nTanggal: ${data.tanggalPembayaran}\nCara Bayar: ${data.caraBayar}`,
          // URL atau file gambar jika diperlukan
        })
        .then(() => console.log("Berbagi berhasil"))
        .catch((error) => console.error("Error saat berbagi:", error));
    } else {
      // Browser tidak mendukung Web Share API
      alert("Maaf, browser Anda tidak mendukung fitur berbagi.");
    }
  }

  // Menangani klik menu Histori di navbar
  const historiNav = document.getElementById("historiNav");
  historiNav.addEventListener("click", tampilkanHistoriPembayaran);

  // Menangani klik tombol Export Excel
  const exportExcelButton = document.getElementById("exportExcel");
  exportExcelButton.addEventListener("click", exportToExcel);

  // Menangani perubahan nilai pada form filter
  filterForm.addEventListener("change", filterData);

  // Menampilkan daftar hutang saat dokumen dimuat
  tampilkanDaftarHutang();
});
