package com.x.server.console.server;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Objects;

import org.eclipse.jetty.server.CustomRequestLog;
import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.RequestLog;
import org.eclipse.jetty.server.Response;
import org.eclipse.jetty.util.component.ContainerLifeCycle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.x.base.core.project.http.HttpToken;

public class ServerRequestLog extends ContainerLifeCycle implements RequestLog {

    private static final Logger LOG = LoggerFactory.getLogger(ServerRequestLog.class);

    public static final String NCSA_FORMAT = "%{client}a - %u %t \"%r\" %s %O";
    public static final String EXTENDED_NCSA_FORMAT = "%{client}a - %u %t \"%r\" %s %O \"%{Referer}i\" \"%{User-Agent}i\"";

    private final CustomRequestLog delegate;
    private final ThreadLocal<Request> currentRequest = new ThreadLocal<>();

    public ServerRequestLog(RequestLog.Writer writer, String formatString) {
        this.delegate = new CustomRequestLog(createWriter(writer), formatString);
        addBean(this.delegate);
    }

    protected RequestLog.Writer createWriter(RequestLog.Writer delegate) {
        return new DnAppendingWriter(delegate);
    }

    @Override
    public void log(Request request, Response response) {
        currentRequest.set(request);
        try {
            delegate.log(request, response);
        } finally {
            currentRequest.remove();
        }
    }

    protected Request getCurrentRequest() {
        return currentRequest.get();
    }

    protected class DnAppendingWriter implements RequestLog.Writer {
        private final RequestLog.Writer delegate;

        DnAppendingWriter(RequestLog.Writer delegate) {
            this.delegate = delegate;
        }

        @Override
        public void write(String requestEntry) throws IOException {
            Request request = getCurrentRequest();
            if (request != null) {
                try {
                    String dn = Objects.toString(request.getAttribute(HttpToken.X_DISTINGUISHEDNAME), "");
                    requestEntry = requestEntry + " \"" + URLEncoder.encode(dn, StandardCharsets.UTF_8.toString()) + "\"";
                } catch (UnsupportedEncodingException e) {
                    LOG.warn("Error encoding DN", e);
                }
            }
            delegate.write(requestEntry);
        }
    }
}
