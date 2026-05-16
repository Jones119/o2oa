package com.x.meeting.assemble.control.factory;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.meeting.assemble.control.AbstractFactory;
import com.x.meeting.assemble.control.Business;
import com.x.meeting.core.entity.Attachment;
import com.x.meeting.core.entity.Attachment_;

public class AttachmentFactory extends AbstractFactory {

	public AttachmentFactory(Business business) throws Exception {
		super(business);
	}

	public List<String> listWithMeeting(String meetingId) throws Exception {
		EntityManager em = this.entityManagerContainer().get(Attachment.class);
		CriteriaBuilder cb = em.getCriteriaBuilder();
		CriteriaQuery<String> cq = cb.createQuery(String.class);
		Root<Attachment> root = cq.from(Attachment.class);
		Predicate p = cb.equal(root.get(Attachment_.meeting), meetingId);
		cq.select(root.get(Attachment_.id)).where(p);
		return em.createQuery(cq).getResultList();
	}

}