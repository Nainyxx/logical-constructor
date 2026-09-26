// launcher поднимает собранный конструктор (папка dist, вшитая в бинарник)
// локальным http-сервером и открывает его в браузере по умолчанию —
// двойной клик на exe/бинарник на любой ОС, без Node/npm на машине пользователя.
package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"time"
)

//go:embed all:dist
var embeddedDist embed.FS

const preferredPort = 8787

func main() {
	site, err := fs.Sub(embeddedDist, "dist")
	if err != nil {
		fatal("не нашёл собранное приложение (dist) внутри самого себя: %v", err)
	}

	listener, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", preferredPort))
	if err != nil {
		// порт занят — пусть система сама выберет свободный
		listener, err = net.Listen("tcp", "127.0.0.1:0")
		if err != nil {
			fatal("не смог открыть порт: %v", err)
		}
	}

	url := fmt.Sprintf("http://%s/", listener.Addr().String())
	fmt.Println("Конструктор логических схем запущен:")
	fmt.Println("  " + url)
	fmt.Println("Не закрывайте это окно, пока пользуетесь приложением.")
	fmt.Println("Чтобы остановить сервер — закройте окно или нажмите Ctrl+C.")

	go func() {
		time.Sleep(300 * time.Millisecond)
		openBrowser(url)
	}()

	if err := http.Serve(listener, http.FileServer(http.FS(site))); err != nil {
		fatal("сервер остановился: %v", err)
	}
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", "", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	_ = cmd.Start()
}

func fatal(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	fmt.Println("Нажмите Enter, чтобы закрыть окно...")
	fmt.Scanln()
	os.Exit(1)
}
