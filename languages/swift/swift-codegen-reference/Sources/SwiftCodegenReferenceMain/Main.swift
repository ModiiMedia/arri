import Foundation
import ArriClient
import SwiftCodegenReference

@main
struct Main {
    static func main() async throws {
        let client = ExampleClient(
            baseURL: "http://localhost:3000",
            delegate: CustomRequestDelegate(),
            headers: {
                return Dictionary()
            }
        )
        let result = try? await client.books.getBook(BookParams(bookId: "12345"))
        print("GOT RESPONSE: \(String(describing: result))")
        let client2 = ExampleClient(
            baseURL: "http://localhost:3000",
            delegate: DefaultRequestDelegate(),
            headers: {
                return Dictionary()
            }
        )
        let startTime = Date()
        let result2 = try? await client2.books.getBook(BookParams(bookId: "15"))
        print("GOT RESPONSE: \(String(describing: result2))")
        print("TIME: \((Date().timeIntervalSince1970 - startTime.timeIntervalSince1970) * 1_000)ms")
        var msgCount = 0
        var errorCount = 0
        var task = await client2.books.watchBook(
            Book(), 
            options: EventSourceOptions(
                onMessage: {book, controller in 
                    print("NEW BOOK: \(book)")
                    msgCount += 1
                    if msgCount >= 10 {
                        controller.cancel()
                    }
                },
                onResponseError: {error, controller in 
                    errorCount += 1
                    print("ERROR_COUNT: \(errorCount) ERROR: \(error)")
                    if errorCount >= 15 {
                        controller.cancel()
                    }
                },
                maxRetryCount: nil,
                maxRetryInterval: nil
            )
        ).result
    }
    
}
