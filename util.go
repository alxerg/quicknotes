package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"

	"github.com/kjk/u"
	"github.com/speps/go-hashids"
)

var (
	hashIDMu sync.Mutex
	hashID   *hashids.HashID
)

func fatalIfErr(err error, what string) {
	if err != nil {
		log.Fatalf("%s failed with %s\n", what, err)
	}
}

func httpErrorf(w http.ResponseWriter, format string, args ...interface{}) {
	msg := format
	if len(args) > 0 {
		msg = fmt.Sprintf(format, args...)
	}
	http.Error(w, msg, http.StatusInternalServerError)
}

func httpOkBytesWithContentType(w http.ResponseWriter, contentType string, content []byte) {
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Length", strconv.Itoa(len(content)))
	w.Write(content)
}

func httpOkWithText(w http.ResponseWriter, s string) {
	w.Header().Set("Content-Type", "text/plain")
	io.WriteString(w, s)
}

func httpOkWithJSON(w http.ResponseWriter, v interface{}) {
	b, err := json.MarshalIndent(v, "", "\t")
	if err != nil {
		// should never happen
		LogErrorf("json.MarshalIndent() failed with %q\n", err)
	}
	httpOkBytesWithContentType(w, "application/json", b)
}

func httpOkWithJSONCompact(w http.ResponseWriter, v interface{}) {
	b, err := json.Marshal(v)
	if err != nil {
		// should never happen
		LogErrorf("json.MarshalIndent() failed with %q\n", err)
	}
	httpOkBytesWithContentType(w, "application/json", b)
}

func httpErrorWithJSONf(w http.ResponseWriter, format string, arg ...interface{}) {
	msg := fmt.Sprintf(format, arg...)
	model := struct {
		Error string
	}{
		Error: msg,
	}
	httpOkWithJSON(w, model)
}

func httpServerError(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "internal server error", http.StatusInternalServerError)
}

func getReferer(r *http.Request) string {
	return r.Header.Get("Referer")
}

func dumpFormValueNames(r *http.Request) {
	r.ParseForm()
	r.ParseMultipartForm(128 * 1024)
	for k := range r.Form {
		fmt.Printf("r.Form: '%s'\n", k)
	}
	if form := r.MultipartForm; form != nil {
		for k := range form.Value {
			fmt.Printf("r.MultipartForm: '%s'\n", k)
		}
	}
}

// heuristic: auto-detects title from the note body. Title is first line if
// relatively short and followed by empty line
func noteToTitleContent(d []byte) (string, []byte) {
	// title is a short line followed by an empty line
	advance1, line1, err := bufio.ScanLines(d, false)
	if err != nil || len(line1) > 100 {
		return "", d
	}
	advance2, line2, err := bufio.ScanLines(d[advance1:], false)
	if err != nil || len(line2) > 0 {
		return "", d
	}
	title, content := string(line1), d[advance1+advance2:]
	if len(content) == 0 && len(title) > 0 {
		content = []byte(title)
		title = ""
	}
	return title, content
}

func trimSpaceLineRight(s string) string {
	if len(s) == 0 {
		return ""
	}
	n := len(s) - 1
	for n >= 0 && isNewline(s[n]) {
		n--
	}
	return s[:n+1]
}

// given foo@bar.com, returns foo
func nameFromEmail(email string) string {
	parts := strings.Split(email, "@")
	return parts[0]
}

func initHashID() {
	hd := hashids.NewData()
	hd.Salt = "bo-&)()(*&tamalola"
	hd.MinLength = 4
	hashID = hashids.NewWithData(hd)
}

func hashInt(n int) string {
	nums := []int{n}
	hashIDMu.Lock()
	res, err := hashID.Encode(nums)
	hashIDMu.Unlock()
	u.PanicIfErr(err)
	return res
}

// TODO: return an error if fails
func dehashInt(s string) int {
	hashIDMu.Lock()
	nums := hashID.Decode(s)
	hashIDMu.Unlock()
	u.PanicIf(len(nums) != 1, "len(nums) is not 1")
	return nums[0]
}

func strArrEqual(a1, a2 []string) bool {
	if len(a1) != len(a2) {
		return false
	}
	if len(a1) == 0 {
		return true
	}
	m := map[string]int{}
	for _, t := range a1 {
		m[t]++
	}
	for _, t := range a2 {
		m[t]++
	}
	// the value for the key can either be 2 if the key is in both
	// arrays or 1 if only in one, which indicates arrays are not
	// the same
	for _, n := range m {
		if n != 2 {
			return false
		}
	}
	return true
}
