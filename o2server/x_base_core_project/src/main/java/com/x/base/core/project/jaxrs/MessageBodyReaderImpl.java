package com.x.base.core.project.jaxrs;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.annotation.Annotation;
import java.lang.reflect.Type;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.ext.MessageBodyReader;
import jakarta.ws.rs.ext.Provider;

import com.google.gson.Gson;
import com.x.base.core.project.gson.XGsonBuilder;

@Provider
@Consumes(MediaType.APPLICATION_JSON)
public class MessageBodyReaderImpl<T> implements MessageBodyReader<T> {

	private Gson gson = XGsonBuilder.instance();

	@Override
	public boolean isReadable(Class<?> type, Type genericType, Annotation[] annotations, MediaType mediaType) {
		return true;
	}

	@Override
	public T readFrom(Class<T> type, Type genericType, Annotation[] annotations, MediaType mediaType,
			MultivaluedMap<String, String> httpHeaders, InputStream stream)
			throws IOException, WebApplicationException {
		try {
			// UTF-8 only
			return gson.fromJson(new InputStreamReader(stream, "UTF-8"), type);
		} catch (Exception e) {
			// 此方法在JAXRS方法之前运行,无法捕获违例
			e.printStackTrace();
			return null;
		}
	}
}