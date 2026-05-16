package com.x.server.console.server;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.eclipse.jetty.server.Request;
import org.eclipse.jetty.server.RequestLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.x.base.core.project.http.HttpToken;

public class ServerRequestLogBody extends ServerRequestLog {

    private static final Logger LOG = LoggerFactory.getLogger(ServerRequestLogBody.class);

    public ServerRequestLogBody(RequestLog.Writer writer, String formatString) {
        super(writer, formatString);
    }

    @Override
    protected RequestLog.Writer createWriter(RequestLog.Writer delegate) {
        return new DnBodyAppendingWriter(delegate);
    }

    private class DnBodyAppendingWriter extends DnAppendingWriter {
        DnBodyAppendingWriter(RequestLog.Writer delegate) {
            super(delegate);
        }

        @Override
        public void write(String requestEntry) throws IOException {
            Request request = getCurrentRequest();
            if (request != null) {
                try {
                    Object body = request.getAttribute(HttpToken.X_REQUESTBODY);
                    if (null != body) {
                        requestEntry = requestEntry + " " + URLEncoder.encode(body.toString(), StandardCharsets.UTF_8.toString());
                    }
                } catch (UnsupportedEncodingException e) {
                    LOG.warn("Error encoding body", e);
                }
            }
            super.write(requestEntry);
        }
    }
}
